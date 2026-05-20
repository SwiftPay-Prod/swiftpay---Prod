using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api.Interfaces;
using safefy_api.Models.PaymentApi;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Calculation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Models.Settings;
using safefy_api_core.Services;
using System.Data;

namespace safefy_api.Services.Internal;

public sealed class AutomaticCashoutService(
    IServiceScopeFactory scopeFactory,
    ILogger<AutomaticCashoutService> logger
) : IAutomaticCashoutService
{
    public async Task ProcessMerchantCashoutsAsync(CancellationToken ct = default)
    {
        foreach (var environment in new[] { ApiEnvironment.Production, ApiEnvironment.Sandbox })
        {
            try
            {
                await ProcessMerchantCashoutsForEnvironmentAsync(environment, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing automatic merchant cashouts for environment {Environment}", environment);
            }
        }
    }

    public async Task ProcessPlatformCashoutAsync(CancellationToken ct = default)
    {
        foreach (var environment in new[] { ApiEnvironment.Production, ApiEnvironment.Sandbox })
        {
            try
            {
                await ProcessPlatformCashoutForEnvironmentAsync(environment, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing automatic platform cashout for environment {Environment}", environment);
            }
        }
    }

    private async Task ProcessMerchantCashoutsForEnvironmentAsync(ApiEnvironment environment, CancellationToken ct)
    {
        using var envScope = HybridEnvironmentProvider.SetEnvironment(environment);
        using var scope = scopeFactory.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();
        var paymentApiClient = scope.ServiceProvider.GetRequiredService<IPaymentApiClient>();

        await EnsurePlatformSettingsSchemaCompatibilityAsync(dbContext, ct);
        await EnsureMerchantSettingsSchemaCompatibilityAsync(dbContext, ct);

        var platformSettings = await dbContext.PlatformSettings.AsNoTracking().OrderBy(p => p.Id).FirstOrDefaultAsync(ct);
        if (platformSettings == null) return;

        var merchants = await dbContext.Merchants
            .AsNoTracking()
            .Include(m => m.MerchantSettings)
            .Include(m => m.PayoutAccounts)
            .Where(m => m.Status == MerchantStatus.Active
                     && m.KycStatus == MerchantKycStatus.Approved
                     && m.MerchantSettings != null)
            .ToListAsync(ct);

        if (merchants.Count == 0) return;

        var merchantIds = merchants.Select(m => m.Id).ToList();
        var balances = await ledgerService.GetMerchantsAvailableBalancesAsync(merchantIds);

        foreach (var merchant in merchants)
        {
            try
            {
                var automaticCashoutConfig = ResolveMerchantAutomaticCashoutConfig(merchant.MerchantSettings!, environment);
                if (!automaticCashoutConfig.IsEnabled)
                {
                    continue;
                }

                var (shouldRun, _, _) = await ShouldRunMerchantByFrequencyAsync(
                    dbContext,
                    merchant.Id,
                    environment,
                    automaticCashoutConfig.Frequency,
                    ct);

                if (!shouldRun)
                {
                    var hasAnyAttempt = await dbContext.AutomaticCashoutLogs
                        .AsNoTracking()
                        .AnyAsync(l => l.MerchantId == merchant.Id && l.Environment == environment, ct);

                    if (!hasAnyAttempt)
                    {
                        var firstScheduledAt = CalculateNextEligibleAtFromAnchor(
                            automaticCashoutConfig.Frequency,
                            DateTime.UtcNow);

                        await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                        {
                            MerchantId = merchant.Id,
                            Environment = environment,
                            AmountAttempted = 0,
                            NetAmount = 0,
                            Status = AutomaticCashoutStatus.Skipped,
                            Message = $"Saque automatizado configurado. A primeira tentativa ocorrerá em {FormatDate(firstScheduledAt)}."
                        }, ct);
                    }

                    continue;
                }

                await ProcessSingleMerchantCashoutAsync(
                    merchant, balances, platformSettings, automaticCashoutConfig, environment, dbContext, paymentApiClient, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error processing automatic cashout for merchant {MerchantId} in {Environment}",
                    merchant.Id, environment);

                await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                {
                    MerchantId = merchant.Id,
                    Environment = environment,
                    AmountAttempted = 0,
                    NetAmount = 0,
                    Status = AutomaticCashoutStatus.Failed,
                    Message = "Erro inesperado ao processar saque automatizado.",
                    TechnicalDetails = ex.Message
                }, ct);
            }
        }
    }

    private async Task ProcessSingleMerchantCashoutAsync(
        Merchant merchant,
        Dictionary<Guid, long> balances,
        PlatformSettings platformSettings,
        MerchantAutomaticCashoutConfig automaticCashoutConfig,
        ApiEnvironment environment,
        PrimaryDbContext dbContext,
        IPaymentApiClient paymentApiClient,
        CancellationToken ct)
    {
        var balance = balances.GetValueOrDefault(merchant.Id, 0);
        var minAmount = automaticCashoutConfig.MinAmount ?? platformSettings.AutomaticCashoutMinAmount;
        var maxAmount = automaticCashoutConfig.MaxAmount;

        if (balance < minAmount)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = merchant.Id,
                Environment = environment,
                AmountAttempted = 0,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = $"Saldo insuficiente. Disponível: R$ {balance / 100.0:N2}, Mínimo: R$ {minAmount / 100.0:N2}."
            }, ct);
            return;
        }

        var amountToCashout = maxAmount.HasValue && maxAmount.Value > 0
            ? Math.Min(balance, maxAmount.Value)
            : balance;

        if (amountToCashout <= 0)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = merchant.Id,
                Environment = environment,
                AmountAttempted = 0,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = $"Valor calculado inválido para saque automatizado. Saldo: R$ {balance / 100.0:N2}, limite máximo configurado: {(maxAmount.HasValue ? $"R$ {maxAmount.Value / 100.0:N2}" : "não definido")}, valor calculado: R$ {amountToCashout / 100.0:N2}."
            }, ct);
            return;
        }

        MerchantPayoutAccount? payoutAccount = null;

        if (automaticCashoutConfig.PayoutAccountId.HasValue)
        {
            payoutAccount = merchant.PayoutAccounts
            .FirstOrDefault(a => a.Id == automaticCashoutConfig.PayoutAccountId.Value
                                  && a.Status == PayoutAccountStatus.Active);

            if (payoutAccount == null)
            {
                await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                {
                    MerchantId = merchant.Id,
                    Environment = environment,
                    AmountAttempted = amountToCashout,
                    NetAmount = 0,
                    Status = AutomaticCashoutStatus.Skipped,
                    Message = $"Conta de saque selecionada não encontrada ou inativa. Conta configurada: {automaticCashoutConfig.PayoutAccountId}."
                }, ct);
                return;
            }
        }
        else
        {
            payoutAccount = merchant.PayoutAccounts
                .FirstOrDefault(a => a.IsDefault && a.Status == PayoutAccountStatus.Active);
        }

        if (payoutAccount == null)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = merchant.Id,
                Environment = environment,
                AmountAttempted = amountToCashout,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = "Nenhuma conta de saque padrão ativa foi encontrada para o merchant. Defina uma conta padrão ativa ou selecione uma conta específica no automático."
            }, ct);
            return;
        }

        var result = await paymentApiClient.CreateCashoutAsync(new CreateCashoutApiInput
        {
            MerchantId = merchant.Id,
            UserId = merchant.UserId,
            Amount = amountToCashout,
            PayoutAccountId = payoutAccount.Id,
            IpAddress = "automatic-cashout",
            Location = "Automatic Cashout Job",
            Environment = environment,
            ConsolidateAllAcquirers = true
        }, ct);

        if (result.Success)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = merchant.Id,
                Environment = environment,
                AmountAttempted = result.Amount ?? amountToCashout,
                NetAmount = result.NetAmount ?? 0,
                Status = AutomaticCashoutStatus.Success,
                Message = $"Saque automatizado de R$ {(result.Amount ?? amountToCashout) / 100.0:N2} criado com sucesso.",
                PayoutId = result.CashoutId
            }, ct);
        }
        else
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = merchant.Id,
                Environment = environment,
                AmountAttempted = amountToCashout,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Failed,
                Message = result.ErrorMessage ?? "Erro ao criar saque automatizado.",
                TechnicalDetails = result.ErrorCode
            }, ct);
        }
    }

    private async Task ProcessPlatformCashoutForEnvironmentAsync(ApiEnvironment environment, CancellationToken ct)
    {
        using var envScope = HybridEnvironmentProvider.SetEnvironment(environment);
        using var scope = scopeFactory.CreateScope();

        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();
        var calculationService = scope.ServiceProvider.GetRequiredService<ICalculationService>();
        var messagePublisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

        await EnsurePlatformSettingsSchemaCompatibilityAsync(dbContext, ct);

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (platformSettings == null)
        {
            return;
        }

        if (!platformSettings.IsAutomaticCashoutEnabled)
        {
            return;
        }

        var (shouldRun, _, _) = await ShouldRunPlatformByFrequencyAsync(
            dbContext,
            environment,
            platformSettings.AutomaticCashoutFrequency,
            ct);

        if (!shouldRun)
        {
            var hasAnyAttempt = await dbContext.AutomaticCashoutLogs
                .AsNoTracking()
                .AnyAsync(l => l.MerchantId == null && l.Environment == environment, ct);

            if (!hasAnyAttempt)
            {
                var firstScheduledAt = CalculateNextEligibleAtFromAnchor(
                    platformSettings.AutomaticCashoutFrequency,
                    DateTime.UtcNow);

                await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                {
                    MerchantId = null,
                    Environment = environment,
                    AmountAttempted = 0,
                    NetAmount = 0,
                    Status = AutomaticCashoutStatus.Skipped,
                    Message = $"Saque automatizado da plataforma configurado. A primeira tentativa ocorrerá em {FormatDate(firstScheduledAt)}."
                }, ct);
            }

            return;
        }

        var balance = await ledgerService.GetTotalAvailableForWithdrawalAsync();

        if (balance < platformSettings.AutomaticCashoutMinAmount)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = 0,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = $"Saldo da plataforma abaixo do mínimo para saque automatizado. Disponível: R$ {balance / 100.0:N2}, Mínimo: R$ {platformSettings.AutomaticCashoutMinAmount / 100.0:N2}."
            }, ct);
            return;
        }

        var amountToCashout = platformSettings.AutomaticCashoutMaxAmount.HasValue && platformSettings.AutomaticCashoutMaxAmount.Value > 0
            ? Math.Min(balance, platformSettings.AutomaticCashoutMaxAmount.Value)
            : balance;

        if (amountToCashout <= 0)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = 0,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = $"Valor calculado inválido para saque automatizado da plataforma. Saldo: R$ {balance / 100.0:N2}, limite máximo configurado: {(platformSettings.AutomaticCashoutMaxAmount.HasValue ? $"R$ {platformSettings.AutomaticCashoutMaxAmount.Value / 100.0:N2}" : "não definido")}, valor calculado: R$ {amountToCashout / 100.0:N2}."
            }, ct);
            return;
        }

        if (balance <= 0)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = 0,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = $"Saldo da plataforma insuficiente para saque automatizado. Disponível: R$ {balance / 100.0:N2}."
            }, ct);
            return;
        }

        PlatformPayoutAccount? payoutAccount = null;

        if (platformSettings.AutomaticCashoutPayoutAccountId.HasValue)
        {
            payoutAccount = await dbContext.PlatformPayoutAccounts
                .AsNoTracking()
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.Id == platformSettings.AutomaticCashoutPayoutAccountId.Value
                                       && a.IsActive
                                       && a.DeactivatedAt == null, ct);

            if (payoutAccount == null)
            {
                await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                {
                    MerchantId = null,
                    Environment = environment,
                    AmountAttempted = amountToCashout,
                    NetAmount = 0,
                    Status = AutomaticCashoutStatus.Skipped,
                    Message = "A conta selecionada para saque automatizado da plataforma não foi encontrada ou está desativada."
                }, ct);
                return;
            }
        }
        else
        {
            payoutAccount = await dbContext.PlatformPayoutAccounts
                .AsNoTracking()
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.IsActive && a.DeactivatedAt == null, ct);
        }

        if (payoutAccount == null)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = amountToCashout,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = "Nenhuma conta de saque da plataforma ativa foi encontrada. Ative uma conta ou configure AutomaticCashoutPayoutAccountId válido em PlatformSettings."
            }, ct);
            return;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);

        var acquirers = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.IsActive && a.SupportsWithdrawal)
            .ToListAsync(ct);

        if (acquirers.Count == 0)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = amountToCashout,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = "Nenhuma adquirente ativa com suporte a saque foi encontrada (filtro: IsActive=true e SupportsWithdrawal=true)."
            }, ct);
            return;
        }

        var availableByAcquirer = await calculationService.GetTotalAvailableForWithdrawalByAcquirerAsync(acquirers, environment, ct);
        var distribution = calculationService.BuildSmartPayoutDistribution(amountToCashout, acquirers, availableByAcquirer);

        if (distribution.Count == 0)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = amountToCashout,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Skipped,
                Message = $"Distribuição não gerada por saldo insuficiente nas adquirentes. Solicitado: R$ {amountToCashout / 100.0:N2}, disponível agregado: R$ {availableByAcquirer.Values.Sum() / 100.0:N2}."
            }, ct);
            return;
        }

        foreach (var item in distribution)
        {
            var available = availableByAcquirer.GetValueOrDefault(item.Acquirer.Id, 0);
            if (item.Amount > available)
            {
                await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                {
                    MerchantId = null,
                    Environment = environment,
                    AmountAttempted = amountToCashout,
                    NetAmount = 0,
                    Status = AutomaticCashoutStatus.Failed,
                    Message = $"Saldo insuficiente na adquirente {item.Acquirer.Name}.",
                    TechnicalDetails = $"Disponível: R$ {available / 100.0:N2}, Solicitado: R$ {item.Amount / 100.0:N2}"
                }, ct);
                return;
            }
        }

        var totalToWithdraw = distribution.Sum(d => d.Amount);
        var platformBalance = await ledgerService.GetPlatformBalanceInfoAsync();

        if (totalToWithdraw > platformBalance.Available)
        {
            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = totalToWithdraw,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Failed,
                Message = "Saldo insuficiente da plataforma para saque automatizado.",
                TechnicalDetails = $"Disponível: R$ {platformBalance.Available / 100.0:N2}, Solicitado: R$ {totalToWithdraw / 100.0:N2}"
            }, ct);
            return;
        }

        var payout = new PlatformPayout
        {
            PlatformPayoutAccountId = payoutAccount.Id,
            Environment = environment,
            TotalAmount = distribution.Sum(d => d.Amount),
            TotalFee = distribution.Sum(d => d.Fee),
            TotalNetAmount = distribution.Sum(d => d.Net),
            Status = PlatformPayoutStatus.Processing,
            Notes = "Saque automatizado da plataforma (Hangfire)",
            RequestedByUserId = SystemUserIds.Admin,
            RequestedAt = DateTime.UtcNow
        };

        dbContext.PlatformPayouts.Add(payout);

        foreach (var (acq, amount, fee, net) in distribution)
        {
            var payoutItem = new PlatformPayoutItem
            {
                PlatformPayoutId = payout.Id,
                AcquirerId = acq.Id,
                Amount = amount,
                AcquirerFee = fee,
                NetAmount = net,
                Status = PlatformPayoutItemStatus.Processing
            };

            dbContext.PlatformPayoutItems.Add(payoutItem);
        }

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        var ledgerResult = await ledgerService.RecordPlatformWithdrawalRequestedAsync(
            payout.Id,
            payout.TotalAmount,
            $"Saque automatizado da plataforma #{payout.Id:N} solicitado");

        if (!ledgerResult.Success)
        {
            await dbContext.PlatformPayoutItems
                .Where(i => i.PlatformPayoutId == payout.Id)
                .ExecuteDeleteAsync(ct);

            await dbContext.PlatformPayouts
                .Where(p => p.Id == payout.Id)
                .ExecuteDeleteAsync(ct);

            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = payout.TotalAmount,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Failed,
                Message = $"Erro ao registrar saque automatizado da plataforma no ledger. Payout: {payout.Id}.",
                TechnicalDetails = ledgerResult.ErrorMessage
            }, ct);
            return;
        }

        try
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessPlatformPayout,
                new ProcessPlatformPayoutMessage
                {
                    PlatformPayoutId = payout.Id,
                    Environment = environment
                },
                ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to publish platform automatic payout message for payout {PayoutId}. Rolling back.", payout.Id);

            var rollbackResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
                payout.Id,
                null,
                payout.TotalAmount,
                $"Saque automatizado da plataforma #{payout.Id:N} revertido por falha no envio da mensagem");

            if (!rollbackResult.Success)
            {
                var failureReason = $"Falha ao reverter saque automático após erro de publish: {rollbackResult.ErrorMessage}";
                var now = DateTime.UtcNow;

                await dbContext.PlatformPayoutItems
                    .Where(i => i.PlatformPayoutId == payout.Id && i.Status == PlatformPayoutItemStatus.Processing)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(i => i.Status, PlatformPayoutItemStatus.Failed)
                        .SetProperty(i => i.FailureReason, failureReason)
                        .SetProperty(i => i.CompletedAt, now), ct);

                await dbContext.PlatformPayouts
                    .Where(p => p.Id == payout.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(p => p.Status, PlatformPayoutStatus.Failed)
                        .SetProperty(p => p.CompletedAt, now), ct);

                await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
                {
                    MerchantId = null,
                    Environment = environment,
                    AmountAttempted = payout.TotalAmount,
                    NetAmount = 0,
                    Status = AutomaticCashoutStatus.Failed,
                    Message = $"Falha crítica no rollback do saque automatizado da plataforma. Payout: {payout.Id}.",
                    TechnicalDetails = rollbackResult.ErrorMessage
                }, ct);

                return;
            }

            await dbContext.PlatformPayoutItems
                .Where(i => i.PlatformPayoutId == payout.Id)
                .ExecuteDeleteAsync(ct);

            await dbContext.PlatformPayouts
                .Where(p => p.Id == payout.Id)
                .ExecuteDeleteAsync(ct);

            await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
            {
                MerchantId = null,
                Environment = environment,
                AmountAttempted = payout.TotalAmount,
                NetAmount = 0,
                Status = AutomaticCashoutStatus.Failed,
                Message = $"Erro ao iniciar processamento assíncrono do saque automatizado da plataforma. Payout: {payout.Id}.",
                TechnicalDetails = ex.Message
            }, ct);
            return;
        }

        await LogCashoutAttemptAsync(dbContext, new AutomaticCashoutLog
        {
            MerchantId = null,
            Environment = environment,
            AmountAttempted = payout.TotalAmount,
            NetAmount = payout.TotalNetAmount,
            Status = AutomaticCashoutStatus.Success,
            Message = $"Saque automatizado da plataforma de R$ {payout.TotalAmount / 100.0:N2} criado com sucesso."
        }, ct);
    }

    private static async Task EnsurePlatformSettingsSchemaCompatibilityAsync(PrimaryDbContext dbContext, CancellationToken ct)
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE "PlatformSettings"
                ADD COLUMN IF NOT EXISTS "PixReservePercentage" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "BoletoReservePercentage" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardReservePercentage" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardEnabled" boolean NOT NULL DEFAULT false,
                ADD COLUMN IF NOT EXISTS "CreditCardApiFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                ADD COLUMN IF NOT EXISTS "CreditCardApiFeeFixed" bigint NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardApiFeePercentage" integer NOT NULL DEFAULT 250,
                ADD COLUMN IF NOT EXISTS "CreditCardApiInstallmentFeePercentage" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeFixed" bigint NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeePercentage" integer NOT NULL DEFAULT 300,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutInstallmentFeePercentage" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeMode" text NOT NULL DEFAULT 'PercentageOnly',
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeFixed" bigint NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeePercentage" integer NOT NULL DEFAULT 300,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkInstallmentFeePercentage" integer NOT NULL DEFAULT 0;
            """, ct);
    }

    private static async Task EnsureMerchantSettingsSchemaCompatibilityAsync(PrimaryDbContext dbContext, CancellationToken ct)
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE "MerchantSettings"
                ADD COLUMN IF NOT EXISTS "PixReservePercentage" integer,
                ADD COLUMN IF NOT EXISTS "BoletoReservePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardReservePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardApiFeeMode" text,
                ADD COLUMN IF NOT EXISTS "CreditCardApiFeeFixed" bigint,
                ADD COLUMN IF NOT EXISTS "CreditCardApiFeePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardApiInstallmentFeePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeMode" text,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeeFixed" bigint,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutFeePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardCheckoutInstallmentFeePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeMode" text,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeeFixed" bigint,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkFeePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardPaymentLinkInstallmentFeePercentage" integer,
                ADD COLUMN IF NOT EXISTS "CreditCardEnabled" boolean;
            """, ct);
    }

    private static async Task LogCashoutAttemptAsync(PrimaryDbContext dbContext, AutomaticCashoutLog log, CancellationToken ct)
    {
        dbContext.AutomaticCashoutLogs.Add(log);
        await dbContext.SaveChangesAsync(ct);
    }

    private static async Task<(bool ShouldRun, DateTime? LastAttemptAt, DateTime? NextEligibleAt)> ShouldRunMerchantByFrequencyAsync(
        PrimaryDbContext dbContext,
        Guid merchantId,
        ApiEnvironment environment,
        AutomaticCashoutFrequency frequency,
        CancellationToken ct)
    {
        var lastAttemptAt = await dbContext.AutomaticCashoutLogs
            .AsNoTracking()
            .Where(l => l.MerchantId == merchantId && l.Environment == environment)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => (DateTime?)l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var nowUtc = DateTime.UtcNow;
        var nextEligibleAt = CalculateNextEligibleAt(frequency, lastAttemptAt);
        return (ShouldRunByFrequency(frequency, lastAttemptAt, nowUtc), lastAttemptAt, nextEligibleAt);
    }

    private static async Task<(bool ShouldRun, DateTime? LastAttemptAt, DateTime? NextEligibleAt)> ShouldRunPlatformByFrequencyAsync(
        PrimaryDbContext dbContext,
        ApiEnvironment environment,
        AutomaticCashoutFrequency frequency,
        CancellationToken ct)
    {
        var lastAttemptAt = await dbContext.AutomaticCashoutLogs
            .AsNoTracking()
            .Where(l => l.MerchantId == null && l.Environment == environment)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => (DateTime?)l.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var nowUtc = DateTime.UtcNow;
        var nextEligibleAt = CalculateNextEligibleAt(frequency, lastAttemptAt);
        return (ShouldRunByFrequency(frequency, lastAttemptAt, nowUtc), lastAttemptAt, nextEligibleAt);
    }

    private static bool ShouldRunByFrequency(AutomaticCashoutFrequency frequency, DateTime? lastAttemptAt, DateTime nowUtc)
    {
        if (!lastAttemptAt.HasValue)
        {
            return false;
        }

        return frequency switch
        {
            AutomaticCashoutFrequency.Minutely => nowUtc >= lastAttemptAt.Value.AddMinutes(1),
            AutomaticCashoutFrequency.Hourly => nowUtc >= lastAttemptAt.Value.AddHours(1),
            AutomaticCashoutFrequency.Daily => nowUtc.Date > lastAttemptAt.Value.Date,
            AutomaticCashoutFrequency.Weekly => StartOfWeekUtc(nowUtc) > StartOfWeekUtc(lastAttemptAt.Value),
            _ => true
        };
    }

    private static DateTime StartOfWeekUtc(DateTime value)
    {
        var utcDate = value.ToUniversalTime().Date;
        var diff = (7 + (utcDate.DayOfWeek - DayOfWeek.Monday)) % 7;
        return utcDate.AddDays(-diff);
    }

    private static DateTime? CalculateNextEligibleAt(AutomaticCashoutFrequency frequency, DateTime? lastAttemptAt)
    {
        if (!lastAttemptAt.HasValue)
        {
            return null;
        }

        return CalculateNextEligibleAtFromAnchor(frequency, lastAttemptAt.Value);
    }

    private static DateTime CalculateNextEligibleAtFromAnchor(AutomaticCashoutFrequency frequency, DateTime anchor)
    {
        var anchorUtc = anchor.ToUniversalTime();

        return frequency switch
        {
            AutomaticCashoutFrequency.Minutely => anchorUtc.AddMinutes(1),
            AutomaticCashoutFrequency.Hourly => anchorUtc.AddHours(1),
            AutomaticCashoutFrequency.Daily => anchorUtc.Date.AddDays(1),
            AutomaticCashoutFrequency.Weekly => StartOfWeekUtc(anchorUtc).AddDays(7),
            _ => anchorUtc
        };
    }

    private static string FormatDate(DateTime? value)
    {
        return value.HasValue ? value.Value.ToString("yyyy-MM-dd HH:mm:ss 'UTC'") : "não disponível";
    }

    private static MerchantAutomaticCashoutConfig ResolveMerchantAutomaticCashoutConfig(MerchantSettings settings, ApiEnvironment environment)
    {
        if (environment == ApiEnvironment.Sandbox)
        {
            return new MerchantAutomaticCashoutConfig(
                settings.IsAutomaticCashoutEnabledSandbox,
                settings.AutomaticCashoutFrequencySandbox,
                settings.AutomaticCashoutMinAmountSandbox,
                settings.AutomaticCashoutMaxAmountSandbox,
                settings.AutomaticCashoutPayoutAccountIdSandbox);
        }

        return new MerchantAutomaticCashoutConfig(
            settings.IsAutomaticCashoutEnabled,
            settings.AutomaticCashoutFrequency,
            settings.AutomaticCashoutMinAmount,
            settings.AutomaticCashoutMaxAmount,
            settings.AutomaticCashoutPayoutAccountId);
    }

    private sealed record MerchantAutomaticCashoutConfig(
        bool IsEnabled,
        AutomaticCashoutFrequency Frequency,
        long? MinAmount,
        long? MaxAmount,
        Guid? PayoutAccountId);
}

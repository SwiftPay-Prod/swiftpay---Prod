using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Mappers;
using swiftpay_api_core.Models.Calculation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Constants;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Sandbox;

namespace swiftpay_api_payment.Services;

public class CashoutService(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IMessagePublisher messagePublisher,
    INotificationService notificationService,
    IEmailService emailService,
    ISandboxService sandboxService,
    ILogger<CashoutService> logger
) : ICashoutService
{

    public async Task<CreateCashoutResult> CreateAsync(CreateCashoutInput input, CancellationToken ct = default)
    {
        var environmentError = ValidateWithdrawalEnvironment(input.Environment);
        if (environmentError != null)
            return environmentError;

        var (payout, payoutAccount, requiresApproval, error) = await CreatePayoutAsync(
            input.MerchantId,
            input.Amount,
            input.PayoutAccountId,
            input.MerchantAcquirerId,
            input.Environment,
            input.ExternalId,
            input.CallbackUrl,
            input.PixKey,
            input.PixKeyType,
            false,
            ct);

        if (error != null)
            return error;

        if (requiresApproval)
        {
            return new CreateCashoutResult
            {
                Success = true,
                Payout = payout,
                PayoutAccount = payoutAccount,
                RequiresApproval = true,
                StatusCode = 201
            };
        }

        // Update status to Processing
        payout!.Status = PayoutStatus.Processing;
        payout.ProcessedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessCashout,
            payout.ToProcessMessage());

        return new CreateCashoutResult
        {
            Success = true,
            Payout = payout,
            PayoutAccount = payoutAccount,
            RequiresApproval = false,
            StatusCode = 201
        };
    }

    public async Task<CreateCashoutResult> CreateInternalAsync(CreateCashoutInternalInput input, CancellationToken ct = default)
    {
        var environmentError = ValidateWithdrawalEnvironment(input.Environment);
        if (environmentError != null)
            return environmentError;

        if (input.ConsolidateAllAcquirers)
        {
            return await CreateConsolidatedPayoutsInternalAsync(input, ct);
        }

        var (payout, payoutAccount, requiresApproval, error) = await CreatePayoutAsync(
            input.MerchantId,
            input.Amount,
            input.PayoutAccountId,
            input.MerchantAcquirerId,
            input.Environment,
            null,
            null,
            null,
            null,
            false,
            ct);

        if (error != null)
            return error;

        if (requiresApproval)
        {
            await SendPayoutRequestedNotificationsAsync(payout!, payoutAccount!, input.IpAddress, input.Location);

            return new CreateCashoutResult
            {
                Success = true,
                Payout = payout,
                PayoutAccount = payoutAccount,
                RequiresApproval = true,
                StatusCode = 201
            };
        }

        payout!.Status = PayoutStatus.Processing;
        payout.ProcessedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessCashout,
            payout.ToProcessMessage());

        return new CreateCashoutResult
        {
            Success = true,
            Payout = payout,
            PayoutAccount = payoutAccount,
            RequiresApproval = false,
            StatusCode = 201
        };
    }

    public async Task<GetCashoutResult> GetByIdAsync(Guid merchantId, Guid cashoutId, ApiEnvironment environment, CancellationToken ct = default)
    {
        var payout = await dbContext.Payouts
            .Include(p => p.PayoutAccount)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p =>
                p.Id == cashoutId &&
                p.MerchantId == merchantId, ct);

        if (payout == null)
        {
            return GetCashoutResult.Fail("Saque não encontrado.", "cashout_not_found", 404);
        }

        return new GetCashoutResult
        {
            Success = true,
            Payout = payout,
            PayoutAccount = payout.PayoutAccount
        };
    }

    public async Task<ListCashoutResult> ListAsync(ListCashoutInput input, CancellationToken ct = default)
    {
        var query = dbContext.Payouts
            .Include(p => p.PayoutAccount)
            .Where(p => p.MerchantId == input.MerchantId);

        if (input.Status.HasValue)
        {
            query = query.Where(p => p.Status == input.Status.Value);
        }

        if (input.StartDate.HasValue)
        {
            query = query.Where(p => p.RequestedAt >= input.StartDate.Value);
        }

        if (input.EndDate.HasValue)
        {
            query = query.Where(p => p.RequestedAt <= input.EndDate.Value);
        }

        var totalItems = await query.CountAsync(ct);

        var payouts = await query
            .OrderByDescending(p => p.RequestedAt)
            .Skip((input.Page - 1) * input.PageSize)
            .Take(input.PageSize)
            .ToListAsync(ct);

        var items = payouts.Select(p => new CashoutListItem
        {
            Id = p.Id,
            Amount = p.Amount,
            Fee = p.PlatformFee,
            NetAmount = p.NetAmount,
            Status = p.Status,
            PixKeyType = p.PayoutAccount?.PixKeyType.ToString() ?? p.InlinePixKeyType,
            PixKey = p.PayoutAccount != null
                ? MaskUtils.MaskPixKey(p.PayoutAccount.PixKey, p.PayoutAccount.PixKeyType.ToString())
                : (p.InlinePixKey != null ? MaskUtils.MaskPixKey(p.InlinePixKey, p.InlinePixKeyType ?? string.Empty) : null),
            EndToEndId = p.PixEndToEndId,
            FailureReason = p.FailureReason,
            RequestedAt = p.RequestedAt,
            CompletedAt = p.CompletedAt,
            CreatedAt = p.CreatedAt
        }).ToList();

        return new ListCashoutResult
        {
            Success = true,
            Items = items,
            TotalItems = totalItems,
            Page = input.Page,
            PageSize = input.PageSize,
            TotalPages = (int)Math.Ceiling(totalItems / (double)input.PageSize)
        };
    }

    public async Task<ApproveCashoutResult> ApproveAsync(Guid cashoutId, Guid evaluatedById, CancellationToken ct = default)
    {
        var payout = await dbContext.Payouts
            .Include(p => p.PayoutAccount)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma!.Acquirer)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == cashoutId, ct);

        if (payout == null)
        {
            return ApproveCashoutResult.Fail("Saque não encontrado.", "cashout_not_found", 404);
        }

        if (payout.Status != PayoutStatus.Pending)
        {
            return ApproveCashoutResult.Fail(
                $"O saque não pode ser aprovado. Status atual: {payout.Status}",
                "invalid_status");
        }

        var payoutAccount = payout.PayoutAccount;
        if (payoutAccount == null && string.IsNullOrEmpty(payout.InlinePixKey))
        {
            return ApproveCashoutResult.Fail("Dados do saque incompletos.", "incomplete_data", 500);
        }

        // Update status to Processing and save evaluation data
        payout.Status = PayoutStatus.Processing;
        payout.ProcessedAt = DateTime.UtcNow;
        payout.EvaluatedById = evaluatedById;
        payout.EvaluatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(ct);

        await messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessCashout,
            payout.ToProcessMessage());

        // Send notification that payout was approved and is being processed
        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Processing.Title,
            NotificationTemplates.Payout.Processing.Message(payout.NetAmount),
            NotificationStatusType.PayoutProcessing,
            payout.Environment,
            actionUrl: NotificationTemplates.Routes.Cashouts);

        return new ApproveCashoutResult
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status,
            AcquirerTransactionId = payout.AcquirerTransactionId
        };
    }

    public async Task<RejectCashoutResult> RejectAsync(Guid cashoutId, Guid evaluatedById, string reason, CancellationToken ct = default)
    {
        var payout = await dbContext.Payouts
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .Include(p => p.PayoutAccount)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == cashoutId, ct);

        if (payout == null)
        {
            return RejectCashoutResult.Fail("Saque não encontrado.", "cashout_not_found", 404);
        }

        if (payout.Status != PayoutStatus.Pending)
        {
            return RejectCashoutResult.Fail(
                $"O saque não pode ser rejeitado. Status atual: {payout.Status}",
                "invalid_status");
        }

        // Save evaluation data
        payout.EvaluatedById = evaluatedById;
        payout.EvaluatedAt = DateTime.UtcNow;

        // Desbloquear o valor (devolver para disponível)
        var ledgerResult = await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            $"Saque rejeitado: {reason}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to unblock withdrawal amount in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);

            return RejectCashoutResult.Fail(
                ledgerResult.ErrorMessage ?? "Erro ao desbloquear saldo.",
                "ledger_error",
                500);
        }

        payout.Status = PayoutStatus.Rejected;
        payout.FailureReason = reason;
        payout.ProcessedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await SendPayoutRejectedNotificationsAsync(payout, reason);
        await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Rejected);

        return new RejectCashoutResult
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status
        };
    }

    public async Task<SimulateCashoutResult> SimulateAsync(Guid merchantId, Guid cashoutId, ApiEnvironment environment, SimulateCashoutAction action, CancellationToken ct = default)
    {
        if (environment != ApiEnvironment.Sandbox)
        {
            return SimulateCashoutResult.Fail(
                "Simulação disponível apenas em ambiente Sandbox.",
                "sandbox_only",
                400);
        }

        var payout = await dbContext.Payouts
            .Include(p => p.MerchantAcquirer)
            .Include(p => p.PayoutAccount)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p =>
                p.Id == cashoutId &&
                p.MerchantId == merchantId, ct);

        if (payout == null)
        {
            return SimulateCashoutResult.Fail("Saque não encontrado.", "cashout_not_found", 404);
        }

        var result = await sandboxService.SimulateCashoutAsync(payout, action, ct);

        if (!result.Success)
        {
            return SimulateCashoutResult.Fail(
                result.ErrorMessage ?? "Erro ao simular saque.",
                result.ErrorCode,
                result.StatusCode);
        }

        // Reload payout to get updated data
        await dbContext.Entry(payout).ReloadAsync(ct);

        return new SimulateCashoutResult
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status,
            EndToEndId = payout.PixEndToEndId,
            AcquirerTransactionId = payout.AcquirerTransactionId
        };
    }

    public async Task<CancelCashoutResult> CancelAsync(Guid merchantId, Guid cashoutId, ApiEnvironment environment, CancellationToken ct = default)
    {
        var payout = await dbContext.Payouts
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .Include(p => p.PayoutAccount)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p =>
                p.Id == cashoutId &&
                p.MerchantId == merchantId, ct);

        if (payout == null)
        {
            return CancelCashoutResult.Fail("Saque não encontrado.", "cashout_not_found", 404);
        }

        if (payout.Status != PayoutStatus.Pending)
        {
            return CancelCashoutResult.Fail(
                $"Apenas saques pendentes podem ser cancelados. Status atual: {payout.Status}",
                "invalid_status");
        }

        // Desbloquear o valor (devolver para disponível)
        var ledgerResult = await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            "Saque cancelado pelo usuário");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to unblock withdrawal amount in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);

            return CancelCashoutResult.Fail(
                ledgerResult.ErrorMessage ?? "Erro ao desbloquear saldo.",
                "ledger_error",
                500);
        }

        payout.Status = PayoutStatus.Cancelled;
        payout.FailureReason = "Cancelado pelo usuário";
        payout.ProcessedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Cancelled.Title,
            NotificationTemplates.Payout.Cancelled.Message(payout.NetAmount),
            NotificationStatusType.PayoutCancelled,
            payout.Environment,
            actionUrl: NotificationTemplates.Routes.Cashouts);

        await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Cancelled);

        return new CancelCashoutResult
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status
        };
    }

    public async Task<CancelCashoutResult> CancelInternalAsync(Guid merchantId, Guid cashoutId, Guid userId, CancellationToken ct = default)
    {
        var payout = await dbContext.Payouts
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .Include(p => p.PayoutAccount)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p =>
                p.Id == cashoutId &&
                p.MerchantId == merchantId, ct);

        if (payout == null)
        {
            return CancelCashoutResult.Fail("Saque não encontrado.", "cashout_not_found", 404);
        }

        if (payout.Status != PayoutStatus.Pending)
        {
            return CancelCashoutResult.Fail(
                $"Apenas saques pendentes podem ser cancelados. Status atual: {payout.Status}",
                "invalid_status");
        }

        // Desbloquear o valor (devolver para disponível)
        var ledgerResult = await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            "Saque cancelado pelo usuário");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to unblock withdrawal amount in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);

            return CancelCashoutResult.Fail(
                ledgerResult.ErrorMessage ?? "Erro ao desbloquear saldo.",
                "ledger_error",
                500);
        }

        payout.Status = PayoutStatus.Cancelled;
        payout.FailureReason = "Cancelado pelo usuário";
        payout.ProcessedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Cancelled.Title,
            NotificationTemplates.Payout.Cancelled.Message(payout.NetAmount),
            NotificationStatusType.PayoutCancelled,
            payout.Environment,
            actionUrl: NotificationTemplates.Routes.Cashouts);

        await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Cancelled);

        return new CancelCashoutResult
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status
        };
    }

    private async Task<CreateCashoutResult> CreateConsolidatedPayoutsInternalAsync(CreateCashoutInternalInput input, CancellationToken ct)
    {
        var merchantValidation = await ValidateMerchantForWithdrawAsync(input.MerchantId, ct);
        if (merchantValidation.Error != null)
            return merchantValidation.Error;

        var merchant = merchantValidation.Merchant!;

        var payoutAccount = await GetPayoutAccountAsync(input.MerchantId, input.PayoutAccountId, ct);
        var accountError = ValidatePayoutAccount(payoutAccount, input.PayoutAccountId);
        if (accountError != null)
            return accountError;

        var settingsValidation = await GetPayoutSettingsAsync(merchant.MerchantSettings, ct);
        if (settingsValidation.Error != null)
            return settingsValidation.Error;

        var platformSettings = settingsValidation.PlatformSettings!;
        var merchantSettings = merchant.MerchantSettings;

        var minWithdrawalAmount = merchantSettings?.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount;
        if (input.Amount < minWithdrawalAmount)
        {
            return CreateCashoutResult.Fail(
                $"O valor mínimo para saque é {FormatUtils.FormatCurrency(minWithdrawalAmount)}.",
                PaymentApiErrorCodes.AmountBelowMinimum);
        }

        var buckets = await ledgerService.GetMerchantAcquirerBucketBalancesAsync(input.MerchantId);
        var bucketsWithBalance = buckets.Where(b => b.Balance > 0 && b.MerchantAcquirerId.HasValue).ToList();

        if (bucketsWithBalance.Count == 0)
        {
            return CreateCashoutResult.Fail(
                "Nenhum saldo disponível para saque.",
                PaymentApiErrorCodes.InsufficientBalance);
        }

        var totalAvailable = bucketsWithBalance.Sum(b => b.Balance);
        if (totalAvailable < input.Amount)
        {
            return CreateCashoutResult.Fail(
                $"Saldo insuficiente. Disponível para saque: {FormatUtils.FormatCurrency(totalAvailable)}. Solicitado: {FormatUtils.FormatCurrency(input.Amount)}.",
                PaymentApiErrorCodes.InsufficientBalance);
        }

        var requiresApproval = DetermineApprovalRequirement(merchantSettings, platformSettings);

        var payouts = new List<Payout>();
        var remainingAmount = input.Amount;

        foreach (var bucket in bucketsWithBalance)
        {
            if (remainingAmount <= 0) break;

            var bucketAmount = Math.Min(bucket.Balance, remainingAmount);

            var acquirerValidation = await GetValidatedMerchantAcquirerAsync(input.MerchantId, bucket.MerchantAcquirerId, ct);
            if (acquirerValidation.Error != null)
                return acquirerValidation.Error;

            var merchantAcquirer = acquirerValidation.MerchantAcquirer!;

            var wfs = MerchantWithdrawalFeeSettings.Resolve(merchantSettings, platformSettings);
            var fees = FeeCalculator.CalculatePayoutFees(
                bucketAmount,
                wfs.FeeMode, wfs.FeeFixed, wfs.FeePercentage,
                merchantAcquirer.PayoutFeeMode, merchantAcquirer.PayoutFeeFixed, merchantAcquirer.PayoutFeePercentage);
            if (fees.NetAmount < 1)
                continue;

            var payout = CreatePayoutEntity(input.MerchantId, payoutAccount!.Id, merchantAcquirer.Id, bucketAmount, fees, input.Environment, null, null,
                acquirerDisplayName: merchantAcquirer.Acquirer?.DisplayName ?? merchantAcquirer.Acquirer?.Name,
                acquirerNominal: merchantAcquirer.Acquirer?.Nominal);
            dbContext.Payouts.Add(payout);
            payouts.Add(payout);

            remainingAmount -= bucketAmount;
        }

        if (payouts.Count == 0)
        {
            return CreateCashoutResult.Fail(
                "Nenhum saque pôde ser criado com os saldos disponíveis.",
                PaymentApiErrorCodes.InsufficientBalance);
        }

        await dbContext.SaveChangesAsync(ct);

        var processedPayouts = new List<Payout>();
        foreach (var payout in payouts)
        {
            var resolvedPk = payoutAccount!.PixKey;
            var resolvedPkt = payoutAccount.PixKeyType.ToString();
            var ledgerError = await RecordPayoutInLedgerAsync(input.MerchantId, payout, resolvedPk, resolvedPkt, payout.PlatformFee);
            if (ledgerError != null)
            {
                foreach (var processedPayout in processedPayouts)
                {
                    await ledgerService.RecordWithdrawalFailedAsync(
                        input.MerchantId,
                        processedPayout.Id,
                        processedPayout.MerchantAcquirerId,
                        processedPayout.Amount,
                        processedPayout.PlatformFee,
                        "Rollback: falha ao processar saque consolidado");
                }

                dbContext.Payouts.RemoveRange(payouts);
                await dbContext.SaveChangesAsync(ct);
                return ledgerError;
            }
            processedPayouts.Add(payout);
        }

        if (requiresApproval)
        {
            await SendPayoutRequestedNotificationsAsync(payouts.First(), payoutAccount!, input.IpAddress, input.Location);

            return new CreateCashoutResult
            {
                Success = true,
                Payout = payouts.First(),
                Payouts = payouts,
                PayoutAccount = payoutAccount,
                RequiresApproval = true,
                StatusCode = 201
            };
        }

        foreach (var payout in payouts)
        {
            payout.Status = PayoutStatus.Processing;
            payout.ProcessedAt = DateTime.UtcNow;
        }
        await dbContext.SaveChangesAsync(ct);

        foreach (var payout in payouts)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessCashout,
                payout.ToProcessMessage());
        }

        return new CreateCashoutResult
        {
            Success = true,
            Payout = payouts.First(),
            Payouts = payouts,
            PayoutAccount = payoutAccount,
            RequiresApproval = false,
            StatusCode = 201
        };
    }

    private async Task<(Payout? Payout, MerchantPayoutAccount? Account, bool RequiresApproval, CreateCashoutResult? Error)> CreatePayoutAsync(
        Guid merchantId,
        long amount,
        Guid? payoutAccountId,
        Guid? merchantAcquirerId,
        ApiEnvironment environment,
        string? externalId,
        string? callbackUrl,
        string? pixKey,
        string? pixKeyType,
        bool consolidateAllAcquirers,
        CancellationToken ct)
    {
        var merchantValidation = await ValidateMerchantForWithdrawAsync(merchantId, ct);
        if (merchantValidation.Error != null)
            return (null, null, false, merchantValidation.Error);

        var merchant = merchantValidation.Merchant!;

        MerchantPayoutAccount? payoutAccount;
        if (!string.IsNullOrEmpty(pixKey))
        {
            payoutAccount = null;
        }
        else
        {
            payoutAccount = await GetPayoutAccountAsync(merchantId, payoutAccountId, ct);
            var accountError = ValidatePayoutAccount(payoutAccount, payoutAccountId);
            if (accountError != null)
                return (null, null, false, accountError);
        }

        var settingsValidation = await GetPayoutSettingsAsync(merchant.MerchantSettings, ct);
        if (settingsValidation.Error != null)
            return (null, null, false, settingsValidation.Error);

        var platformSettings = settingsValidation.PlatformSettings!;
        var merchantSettings = merchant.MerchantSettings;

        var amountError = await ValidateWithdrawalAmountAsync(merchantId, merchantAcquirerId, amount, merchantSettings, platformSettings, consolidateAllAcquirers);
        if (amountError != null)
            return (null, null, false, amountError);

        var acquirerValidation = await GetValidatedMerchantAcquirerAsync(merchantId, merchantAcquirerId, ct);
        if (acquirerValidation.Error != null)
            return (null, null, false, acquirerValidation.Error);

        var merchantAcquirer = acquirerValidation.MerchantAcquirer!;

        var wfs = MerchantWithdrawalFeeSettings.Resolve(merchantSettings, platformSettings);
        var fees = FeeCalculator.CalculatePayoutFees(
            amount,
            wfs.FeeMode, wfs.FeeFixed, wfs.FeePercentage,
            merchantAcquirer.PayoutFeeMode, merchantAcquirer.PayoutFeeFixed, merchantAcquirer.PayoutFeePercentage);
        if (fees.NetAmount < 1)
        {
            return (null, null, false, CreateCashoutResult.Fail(
                "O valor líquido a receber deve ser de no mínimo R$ 0,01.",
                PaymentApiErrorCodes.InvalidAmount,
                400));
        }

        var requiresApproval = DetermineApprovalRequirement(merchantSettings, platformSettings);

        var payout = CreatePayoutEntity(merchantId, payoutAccount?.Id, merchantAcquirer.Id, amount, fees, environment, externalId, callbackUrl, pixKey, pixKeyType,
            acquirerDisplayName: merchantAcquirer.Acquirer?.DisplayName ?? merchantAcquirer.Acquirer?.Name,
            acquirerNominal: merchantAcquirer.Acquirer?.Nominal);
        dbContext.Payouts.Add(payout);
        await dbContext.SaveChangesAsync(ct);

        var resolvedPixKey = payoutAccount?.PixKey ?? pixKey ?? string.Empty;
        var resolvedPixKeyType = payoutAccount?.PixKeyType.ToString() ?? pixKeyType ?? string.Empty;
        var ledgerError = await RecordPayoutInLedgerAsync(merchantId, payout, resolvedPixKey, resolvedPixKeyType, fees.PlatformFee);
        if (ledgerError != null)
        {
            dbContext.Payouts.Remove(payout);
            await dbContext.SaveChangesAsync(ct);
            return (null, null, false, ledgerError);
        }

        return (payout, payoutAccount, requiresApproval, null);
    }

    private async Task<(Merchant? Merchant, CreateCashoutResult? Error)> ValidateMerchantForWithdrawAsync(Guid merchantId, CancellationToken ct)
    {
        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == merchantId, ct);

        if (merchant == null)
            return (null, CreateCashoutResult.Fail("Organização não encontrada.", "merchant_not_found", 404));

        if (merchant.Status != MerchantStatus.Active)
            return (null, CreateCashoutResult.Fail("A organização precisa estar ativa para solicitar saques.", "merchant_inactive"));

        return (merchant, null);
    }

    private static CreateCashoutResult? ValidateWithdrawalEnvironment(ApiEnvironment environment)
    {
        if (environment != ApiEnvironment.Sandbox)
            return null;

        return CreateCashoutResult.Fail(
            "Saques não estão disponíveis em ambiente Sandbox.",
            PaymentApiErrorCodes.SandboxWithdrawalNotAllowed,
            400);
    }

    private static CreateCashoutResult? ValidatePayoutAccount(MerchantPayoutAccount? payoutAccount, Guid? payoutAccountId)
    {
        if (payoutAccount != null)
            return null;

        return CreateCashoutResult.Fail(
            payoutAccountId.HasValue
                ? "Conta de saque não encontrada ou inativa."
                : "Nenhuma conta de saque padrão encontrada. Cadastre uma conta de saque primeiro.",
            "payout_account_not_found",
            payoutAccountId.HasValue ? 404 : 400);
    }

    private async Task<(PlatformSettings? PlatformSettings, CreateCashoutResult? Error)> GetPayoutSettingsAsync(MerchantSettings? merchantSettings, CancellationToken ct)
    {
        var platformSettings = await dbContext.PlatformSettings.OrderBy(p => p.Id).FirstOrDefaultAsync(ct);

        if (platformSettings == null)
            return (null, CreateCashoutResult.Fail("Configurações da plataforma não encontradas.", "platform_settings_not_found", 500));

        var withdrawalEnabled = merchantSettings?.WithdrawalEnabled ?? platformSettings.WithdrawalEnabled;
        if (!withdrawalEnabled)
        {
            return (null, CreateCashoutResult.Fail(
                "Saques estão desabilitados para esta conta.",
                PaymentApiErrorCodes.PaymentMethodDisabled,
                400));
        }

        return (platformSettings, null);
    }

    private async Task<CreateCashoutResult?> ValidateWithdrawalAmountAsync(
        Guid merchantId,
        Guid? merchantAcquirerId,
        long amount,
        MerchantSettings? merchantSettings,
        PlatformSettings platformSettings,
        bool consolidateAllAcquirers = false)
    {
        var availableBalance = await ledgerService.GetMerchantAvailableBalanceAsync(merchantId);

        long availableForCurrentOperation;
        if (consolidateAllAcquirers)
        {
            availableForCurrentOperation = availableBalance;
        }
        else if (merchantAcquirerId.HasValue)
        {
            availableForCurrentOperation = await ledgerService.GetMerchantAvailableBalanceAsync(merchantId, merchantAcquirerId.Value);
        }
        else
        {
            availableForCurrentOperation = await ledgerService.GetMerchantWithdrawNowAvailableBalanceAsync(merchantId);
        }

        var minWithdrawalAmount = merchantSettings?.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount;
        if (amount < minWithdrawalAmount)
        {
            return CreateCashoutResult.Fail(
                $"O valor mínimo para saque é {FormatUtils.FormatCurrency(minWithdrawalAmount)}.",
                PaymentApiErrorCodes.AmountBelowMinimum);
        }

        if (availableForCurrentOperation < amount)
        {
            return CreateCashoutResult.Fail(
                $"Saldo insuficiente. Disponível para saque agora: {FormatUtils.FormatCurrency(availableForCurrentOperation)}. Necessário: {FormatUtils.FormatCurrency(amount)}.",
                PaymentApiErrorCodes.InsufficientBalance);
        }

        return null;
    }

    private async Task<(MerchantAcquirer? MerchantAcquirer, CreateCashoutResult? Error)> GetValidatedMerchantAcquirerAsync(Guid merchantId, Guid? merchantAcquirerId, CancellationToken ct)
    {
        var merchantAcquirerQuery = dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .Where(ma => ma.MerchantId == merchantId);

        if (merchantAcquirerId.HasValue)
        {
            merchantAcquirerQuery = merchantAcquirerQuery.Where(ma => ma.Id == merchantAcquirerId.Value);
        }
        else
        {
            merchantAcquirerQuery = merchantAcquirerQuery.Where(ma => ma.IsActive);
        }

        var merchantAcquirer = await merchantAcquirerQuery
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ct);

        if (merchantAcquirer == null)
        {
            return (null, CreateCashoutResult.Fail(
                "Nenhuma processadora configurada para processamento de saques.",
                "no_acquirer_configured"));
        }

        if (!merchantAcquirer.Acquirer!.IsActive)
        {
            return (null, CreateCashoutResult.Fail(
                "A nominal ativa desta organizacao esta desabilitada. Altere para outra nominal nas configuracoes da organizacao.",
                PaymentApiErrorCodes.NominalDisabled,
                400));
        }

        if (!merchantAcquirer.Acquirer!.SupportsWithdrawal)
        {
            return (null, CreateCashoutResult.Fail(
                "Adquirente configurado não suporta saques.",
                "unsupported_withdrawal"));
        }

        return (merchantAcquirer, null);
    }



    private static bool DetermineApprovalRequirement(MerchantSettings? merchantSettings, PlatformSettings platformSettings)
    {
        var approvalMode = merchantSettings?.WithdrawalApprovalMode ?? platformSettings.WithdrawalApprovalMode;
        return approvalMode == WithdrawalApprovalMode.Manual;
    }

    private static Payout CreatePayoutEntity(
        Guid merchantId,
        Guid? payoutAccountId,
        Guid merchantAcquirerId,
        long amount,
        PayoutFeeResult fees,
        ApiEnvironment environment,
        string? externalId,
        string? callbackUrl,
        string? inlinePixKey = null,
        string? inlinePixKeyType = null,
        string? acquirerDisplayName = null,
        string? acquirerNominal = null)
    {
        return new Payout
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchantId,
            MerchantPayoutAccountId = payoutAccountId,
            InlinePixKey = inlinePixKey,
            InlinePixKeyType = inlinePixKeyType,
            MerchantAcquirerId = merchantAcquirerId,
            AcquirerDisplayName = acquirerDisplayName,
            AcquirerNominal = acquirerNominal,
            ExternalId = externalId,
            Amount = amount,
            PlatformFee = fees.PlatformFee,
            AcquirerFee = fees.AcquirerFee,
            NetAmount = fees.NetAmount,
            Status = PayoutStatus.Pending,
            Environment = environment,
            RequestedAt = DateTime.UtcNow,
            CallbackUrl = callbackUrl,
            CallbackStatus = string.IsNullOrWhiteSpace(callbackUrl) ? CallbackStatus.NotConfigured : CallbackStatus.Pending
        };
    }

    private async Task<CreateCashoutResult?> RecordPayoutInLedgerAsync(
        Guid merchantId,
        Payout payout,
        string pixKey,
        string pixKeyType,
        long platformFee)
    {
        var ledgerResult = await ledgerService.RecordWithdrawalRequestedAsync(
            merchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            platformFee,
            $"Saque solicitado para {MaskUtils.MaskPixKey(pixKey, pixKeyType)}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to block withdrawal amount in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);

            return CreateCashoutResult.Fail(
                ledgerResult.ErrorMessage ?? "Erro ao bloquear saldo para saque.",
                "ledger_error",
                500);
        }

        return null;
    }

    private async Task<MerchantPayoutAccount?> GetPayoutAccountAsync(Guid merchantId, Guid? payoutAccountId, CancellationToken ct)
    {
        if (payoutAccountId.HasValue)
        {
            return await dbContext.MerchantPayoutAccounts
                .Where(a => a.Id == payoutAccountId.Value
                    && a.MerchantId == merchantId
                    && a.Status == PayoutAccountStatus.Active)
                .OrderBy(a => a.Id)
                .FirstOrDefaultAsync(ct);
        }

        return await dbContext.MerchantPayoutAccounts
            .Where(a => a.MerchantId == merchantId
                && a.Status == PayoutAccountStatus.Active
                && a.IsDefault)
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(ct);
    }

    private async Task SendPayoutRequestedNotificationsAsync(
        Payout payout,
        MerchantPayoutAccount? payoutAccount,
        string ipAddress,
        string? location)
    {
        var pixKeyForDisplay = payoutAccount?.PixKey ?? payout.InlinePixKey ?? string.Empty;
        var rawPixKeyType = payoutAccount?.PixKeyType.ToString() ?? payout.InlinePixKeyType ?? string.Empty;
        var pixKeyTypeDisplayName = Enum.TryParse<PixKeyType>(rawPixKeyType, out var parsedKeyType)
            ? FormatUtils.GetPixKeyTypeDisplayName(parsedKeyType)
            : rawPixKeyType;
        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .Where(m => m.Id == payout.MerchantId)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync();

        if (merchant == null) return;

        _ = notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Pending.Title,
            NotificationTemplates.Payout.Pending.Message(payout.NetAmount),
            NotificationStatusType.PayoutPending,
            payout.Environment,
            actionUrl: NotificationTemplates.Routes.Cashouts);

        var user = merchant.User;
        var brazilTime = FormatUtils.GetBrazilTime();

        _ = emailService.SendAsync(
            user.Email,
            "💸 Saque Solicitado - Safefy",
            EmailTemplate.PayoutRequested,
            new Dictionary<string, string>
            {
                { "NAME", user.Name },
                { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                { "PAYOUT_ID", payout.Id.ToString() },
                { "AMOUNT", FormatUtils.FormatCurrencyNumber(payout.Amount) },
                { "FEE_AMOUNT", FormatUtils.FormatCurrencyNumber(payout.PlatformFee) },
                { "NET_AMOUNT", FormatUtils.FormatCurrencyNumber(payout.NetAmount) },
                { "PIX_KEY_TYPE", pixKeyTypeDisplayName },
                { "PIX_KEY", MaskUtils.MaskPixKey(pixKeyForDisplay, rawPixKeyType) },
                { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                { "TIME", brazilTime.ToString("HH:mm:ss") },
                { "IP_ADDRESS", ipAddress },
                { "LOCATION", location ?? "Desconhecido" }
            },
            userId: user.Id,
            merchantId: merchant.Id);
    }

    private async Task SendPayoutRejectedNotificationsAsync(Payout payout, string reason)
    {
        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Rejected.Title,
            NotificationTemplates.Payout.Rejected.Message(payout.NetAmount),
            NotificationStatusType.PayoutRejected,
            payout.Environment,
            actionUrl: NotificationTemplates.Routes.Cashouts);

        var merchant = payout.Merchant;
        var user = merchant?.User;

        if (user?.Email != null)
        {
            _ = emailService.SendAsync(
                user.Email,
                "❌ Saque Rejeitado - Safefy",
                EmailTemplate.PayoutRejected,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "MERCHANT_NAME", merchant!.Name ?? "Sua organização" },
                    { "AMOUNT", FormatUtils.FormatCurrencyNumber(payout.Amount) },
                    { "FEE_AMOUNT", FormatUtils.FormatCurrencyNumber(payout.PlatformFee) },
                    { "NET_AMOUNT", FormatUtils.FormatCurrencyNumber(payout.NetAmount) },
                    { "REASON", reason },
                    { "DATE", DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm:ss") }
                },
                userId: user.Id,
                merchantId: merchant.Id);
        }
    }

    public async Task<ProcessCashoutWebhookResult> ProcessAcquirerWebhookAsync(AcquirerCashoutWebhookData data, CancellationToken ct = default)
    {
        Guid? lockedPayoutId = null;

        try
        {
            if (!IsTerminalWebhookStatus(data.Status))
            {
                logger.LogError(
                    "Ignoring non-terminal webhook status to protect balances: TxId={TxId}, ExternalId={ExternalId}, Status={Status}",
                    data.TxId,
                    data.ExternalId,
                    data.Status);

                return new ProcessCashoutWebhookResult
                {
                    Success = true,
                    Status = data.Status
                };
            }

            var now = DateTime.UtcNow;

            var lockResult = await TryAcquirePayoutLockAsync(data, now, ct);

            if (lockResult.RowsAffected == 0)
            {
                return await HandlePayoutNotFoundOrLockedAsync(data, ct);
            }

            var payout = await FetchLockedPayoutAsync(data.TxId, data.ExternalId, ct, data.AcquirerTransactionId);

            if (payout == null)
            {
                return new ProcessCashoutWebhookResult
                {
                    Success = false,
                    PayoutNotFound = true,
                    ErrorMessage = "Payout não encontrado após lock"
                };
            }

            lockedPayoutId = payout.Id;

            var previousStatus = PayoutStatus.Processing;
            payout.AcquirerTransactionId = data.AcquirerTransactionId ?? payout.AcquirerTransactionId;
            payout.PixEndToEndId = data.EndToEndId ?? payout.PixEndToEndId;
            payout.AcquirerStatus = data.Status.ToString().ToUpperInvariant();

            switch (data.Status)
            {
                case PayoutStatus.Completed:
                    var webhookAcquirerId = payout.MerchantAcquirer?.AcquirerId ?? Guid.Empty;
                    if (webhookAcquirerId == Guid.Empty)
                    {
                        payout.Status = previousStatus;
                        await dbContext.SaveChangesAsync(ct);
                        return new ProcessCashoutWebhookResult
                        {
                            Success = false,
                            ErrorMessage = "Adquirente do saque não encontrada para conclusão via webhook."
                        };
                    }

                    payout.Status = PayoutStatus.Completed;
                    payout.CompletedAt = data.CompletedAt ?? DateTime.UtcNow;

                    var ledgerResultCompleted = await ledgerService.RecordWithdrawalCompletedAsync(
                        payout.MerchantId,
                        payout.Id,
                        payout.MerchantAcquirerId,
                        webhookAcquirerId,
                        payout.Amount,
                        payout.PlatformFee,
                        payout.AcquirerFee,
                        $"Saque confirmado via webhook - E2E: {data.EndToEndId}");

                    if (!ledgerResultCompleted.Success)
                    {
                        payout.Status = previousStatus;
                        await dbContext.SaveChangesAsync(ct);
                        return new ProcessCashoutWebhookResult
                        {
                            Success = false,
                            ErrorMessage = $"Falha ao registrar conclusão do saque no ledger: {ledgerResultCompleted.ErrorMessage}"
                        };
                    }

                    await dbContext.SaveChangesAsync(ct);

                    var maskedKey = MaskUtils.MaskPixKey(payout.PayoutAccount?.PixKey, payout.PayoutAccount?.PixKeyType.ToString());
                    await messagePublisher.PublishAsync(
                        RabbitMQQueues.NotificationCreated,
                        new NotificationCreatedMessage(
                            NotificationId: Guid.CreateVersion7(),
                            Scope: NotificationScope.Merchant,
                            MerchantId: payout.MerchantId,
                            UserId: null,
                            Environment: payout.Environment,
                            Type: NotificationType.Success,
                            StatusType: NotificationStatusType.PayoutCompleted,
                            Priority: NotificationPriority.Normal,
                            Title: NotificationTemplates.Payout.Completed.Title,
                            Message: NotificationTemplates.Payout.Completed.MessageWithAccount(payout.NetAmount, maskedKey ?? ""),
                            ActionUrl: NotificationTemplates.Routes.Cashouts,
                            ActionLabel: NotificationTemplates.DefaultActionLabel,
                            IsRead: false,
                            ReadAt: null,
                            CreatedAt: DateTime.UtcNow));

                            await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Completed);
                    break;

                case PayoutStatus.Failed:
                    if (await HasSettlementOutRecordedAsync(payout.Id, ct))
                    {
                        payout.Status = PayoutStatus.Completed;
                        payout.CompletedAt ??= data.CompletedAt ?? DateTime.UtcNow;
                        payout.FailureReason = null;
                        await dbContext.SaveChangesAsync(ct);

                        return new ProcessCashoutWebhookResult
                        {
                            Success = true,
                            PayoutId = payout.Id,
                            Status = payout.Status,
                            UsedFallbackCorrelation = lockResult.UsedFallbackCorrelation,
                            ErrorMessage = "Webhook de falha ignorado: saque já liquidado no ledger."
                        };
                    }

                    payout.Status = PayoutStatus.Failed;
                    payout.FailureReason = data.RejectReason ?? "Falha no processamento";

                    var ledgerResultFailed = await ledgerService.RecordWithdrawalFailedAsync(
                        payout.MerchantId,
                        payout.Id,
                        payout.MerchantAcquirerId,
                        payout.Amount,
                        payout.PlatformFee,
                        payout.FailureReason);

                    if (!ledgerResultFailed.Success)
                    {
                        payout.Status = previousStatus;
                        await dbContext.SaveChangesAsync(ct);
                        return new ProcessCashoutWebhookResult
                        {
                            Success = false,
                            ErrorMessage = $"Falha ao restaurar saldo no ledger: {ledgerResultFailed.ErrorMessage}"
                        };
                    }

                    await dbContext.SaveChangesAsync(ct);
                    await SendPayoutRejectedNotificationsAsync(payout, payout.FailureReason);
                    await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Failed);
                    break;

                case PayoutStatus.Cancelled:
                    if (await HasSettlementOutRecordedAsync(payout.Id, ct))
                    {
                        payout.Status = PayoutStatus.Completed;
                        payout.CompletedAt ??= data.CompletedAt ?? DateTime.UtcNow;
                        payout.FailureReason = null;
                        await dbContext.SaveChangesAsync(ct);

                        return new ProcessCashoutWebhookResult
                        {
                            Success = true,
                            PayoutId = payout.Id,
                            Status = payout.Status,
                            UsedFallbackCorrelation = lockResult.UsedFallbackCorrelation,
                            ErrorMessage = "Webhook de cancelamento ignorado: saque já liquidado no ledger."
                        };
                    }

                    payout.Status = PayoutStatus.Cancelled;
                    payout.FailureReason = data.RejectReason ?? "Saque cancelado pela adquirente";

                    var ledgerResultCancelled = await ledgerService.RecordWithdrawalFailedAsync(
                        payout.MerchantId,
                        payout.Id,
                        payout.MerchantAcquirerId,
                        payout.Amount,
                        payout.PlatformFee,
                        payout.FailureReason);

                    if (!ledgerResultCancelled.Success)
                    {
                        payout.Status = previousStatus;
                        await dbContext.SaveChangesAsync(ct);
                        return new ProcessCashoutWebhookResult
                        {
                            Success = false,
                            ErrorMessage = $"Falha ao restaurar saldo no ledger: {ledgerResultCancelled.ErrorMessage}"
                        };
                    }

                    await dbContext.SaveChangesAsync(ct);
                    await notificationService.CreatePayoutNotificationAsync(
                        payout.MerchantId,
                        NotificationTemplates.Payout.Cancelled.Title,
                        NotificationTemplates.Payout.Cancelled.Message(payout.NetAmount),
                        NotificationStatusType.PayoutCancelled,
                        payout.Environment,
                        actionUrl: NotificationTemplates.Routes.Cashouts);
                    await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Cancelled);
                    break;

                case PayoutStatus.Rejected:
                    if (await HasSettlementOutRecordedAsync(payout.Id, ct))
                    {
                        payout.Status = PayoutStatus.Completed;
                        payout.CompletedAt ??= data.CompletedAt ?? DateTime.UtcNow;
                        payout.FailureReason = null;
                        await dbContext.SaveChangesAsync(ct);

                        return new ProcessCashoutWebhookResult
                        {
                            Success = true,
                            PayoutId = payout.Id,
                            Status = payout.Status,
                            UsedFallbackCorrelation = lockResult.UsedFallbackCorrelation,
                            ErrorMessage = "Webhook de rejeição ignorado: saque já liquidado no ledger."
                        };
                    }

                    payout.Status = PayoutStatus.Rejected;
                    payout.FailureReason = data.RejectReason ?? "Saque rejeitado pela adquirente";

                    var ledgerResultRejected = await ledgerService.RecordWithdrawalFailedAsync(
                        payout.MerchantId,
                        payout.Id,
                        payout.MerchantAcquirerId,
                        payout.Amount,
                        payout.PlatformFee,
                        payout.FailureReason);

                    if (!ledgerResultRejected.Success)
                    {
                        payout.Status = previousStatus;
                        await dbContext.SaveChangesAsync(ct);
                        return new ProcessCashoutWebhookResult
                        {
                            Success = false,
                            ErrorMessage = $"Falha ao restaurar saldo no ledger: {ledgerResultRejected.ErrorMessage}"
                        };
                    }

                    await dbContext.SaveChangesAsync(ct);
                    await SendPayoutRejectedNotificationsAsync(payout, payout.FailureReason);
                    await PublishCashoutWebhookIfConfiguredAsync(payout, WebhookEvents.Cashout.Rejected);
                    break;

                default:
                    payout.Status = previousStatus;
                    await dbContext.SaveChangesAsync(ct);
                    break;
            }

            return new ProcessCashoutWebhookResult
            {
                Success = true,
                PayoutId = payout.Id,
                Status = payout.Status,
                UsedFallbackCorrelation = lockResult.UsedFallbackCorrelation
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing cashout webhook: TxId={TxId}, ExternalId={ExternalId}, Status={Status}",
                data.TxId,
                data.ExternalId,
                data.Status);

            await ReleaseConfirmingLockAsync(lockedPayoutId, data, ct);

            return new ProcessCashoutWebhookResult
            {
                Success = false,
                ErrorMessage = "Erro interno ao processar webhook de saque"
            };
        }
    }

    private static bool IsTerminalWebhookStatus(PayoutStatus status)
    {
        return status is PayoutStatus.Completed or PayoutStatus.Failed or PayoutStatus.Rejected or PayoutStatus.Cancelled;
    }

    private async Task<bool> HasSettlementOutRecordedAsync(Guid payoutId, CancellationToken ct)
    {
        return await dbContext.LedgerTransactions
            .AsNoTracking()
            .AnyAsync(t => t.PayoutId == payoutId && t.Operation == LedgerTransactionOperation.SettlementOut, ct);
    }

    private async Task<LockAcquisitionResult> TryAcquirePayoutLockAsync(AcquirerCashoutWebhookData data, DateTime now, CancellationToken ct)
    {
        var validSourceStatuses = new[] { PayoutStatus.Processing };
        var txId = data.TxId;
        var acquirerTransactionId = data.AcquirerTransactionId;
        var externalId = data.ExternalId;

        if (!string.IsNullOrEmpty(txId))
        {
            var byTxId = await dbContext.Payouts
                .Where(p => p.AcquirerTransactionId == txId && validSourceStatuses.Contains(p.Status))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, PayoutStatus.Confirming)
                    .SetProperty(p => p.UpdatedAt, now), ct);

            if (byTxId > 0) return new LockAcquisitionResult(byTxId, false);
        }

        if (!string.IsNullOrEmpty(acquirerTransactionId))
        {
            var byAcquirerTransactionId = await dbContext.Payouts
                .Where(p => p.AcquirerTransactionId == acquirerTransactionId && validSourceStatuses.Contains(p.Status))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, PayoutStatus.Confirming)
                    .SetProperty(p => p.UpdatedAt, now), ct);

            if (byAcquirerTransactionId > 0) return new LockAcquisitionResult(byAcquirerTransactionId, false);
        }

        if (!string.IsNullOrEmpty(externalId))
        {
            var payoutIdStr = externalId.Replace("PAYOUT", "", StringComparison.OrdinalIgnoreCase);
            if (Guid.TryParse(payoutIdStr, out var payoutId))
            {
                var byExternalId = await dbContext.Payouts
                    .Where(p => p.Id == payoutId && validSourceStatuses.Contains(p.Status))
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(p => p.Status, PayoutStatus.Confirming)
                        .SetProperty(p => p.UpdatedAt, now), ct);

                return new LockAcquisitionResult(byExternalId, false);
            }
        }

        if (data.AcquirerType == AcquirerType.Rapdyn
            && data.Amount.HasValue
            && !string.IsNullOrWhiteSpace(data.PixKey))
        {
            var normalizedIncomingPixKey = NormalizePixKey(data.PixKey);

            var candidates = await dbContext.Payouts
                .AsNoTracking()
                .Include(p => p.PayoutAccount)
                .Include(p => p.MerchantAcquirer)
                    .ThenInclude(ma => ma!.Acquirer)
                .Where(p => p.Status == PayoutStatus.Processing
                    && p.PayoutAccount != null
                    && p.MerchantAcquirer != null
                    && p.MerchantAcquirer.Acquirer != null
                    && p.MerchantAcquirer.Acquirer.Type == AcquirerType.Rapdyn)
                .ToListAsync(ct);

            var matchedIds = candidates
                .Where(p => IsAmountCompatible(data.Amount.Value, p.Amount, p.NetAmount, p.AcquirerFee)
                    && IsPixKeyCompatible(normalizedIncomingPixKey, p.PayoutAccount!.PixKey))
                .Select(p => p.Id)
                .Distinct()
                .ToList();

            if (matchedIds.Count == 1)
            {
                var payoutId = matchedIds[0];
                var byFallback = await dbContext.Payouts
                    .Where(p => p.Id == payoutId && validSourceStatuses.Contains(p.Status))
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(p => p.Status, PayoutStatus.Confirming)
                        .SetProperty(p => p.UpdatedAt, now), ct);

                return new LockAcquisitionResult(byFallback, byFallback > 0);
            }
        }

        return new LockAcquisitionResult(0, false);
    }

    private readonly record struct LockAcquisitionResult(int RowsAffected, bool UsedFallbackCorrelation);

    private static PayoutStatus MapPlatformPayoutItemStatusToPayoutStatus(PlatformPayoutItemStatus status)
    {
        return status switch
        {
            PlatformPayoutItemStatus.Completed => PayoutStatus.Completed,
            PlatformPayoutItemStatus.Cancelled => PayoutStatus.Cancelled,
            PlatformPayoutItemStatus.Failed => PayoutStatus.Failed,
            _ => PayoutStatus.Processing
        };
    }

    private static bool IsAmountCompatible(long incomingAmount, long amount, long netAmount, long acquirerFee)
    {
        if (incomingAmount == amount)
            return true;

        if (incomingAmount == netAmount)
            return true;

        if (incomingAmount == netAmount + acquirerFee)
            return true;

        return false;
    }

    private static bool IsPixKeyCompatible(string normalizedIncomingPixKey, string? payoutPixKey)
    {
        if (string.IsNullOrWhiteSpace(normalizedIncomingPixKey) || string.IsNullOrWhiteSpace(payoutPixKey))
            return false;

        var normalizedStoredKey = NormalizePixKey(payoutPixKey);
        if (string.Equals(normalizedIncomingPixKey, normalizedStoredKey, StringComparison.OrdinalIgnoreCase))
            return true;

        var incomingDigits = new string(normalizedIncomingPixKey.Where(char.IsDigit).ToArray());
        var storedDigits = new string(normalizedStoredKey.Where(char.IsDigit).ToArray());

        if (!string.IsNullOrWhiteSpace(incomingDigits)
            && !string.IsNullOrWhiteSpace(storedDigits)
            && string.Equals(incomingDigits, storedDigits, StringComparison.Ordinal))
        {
            return true;
        }

        return false;
    }

    private static string NormalizePixKey(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var trimmed = value.Trim().ToLowerInvariant();
        var isEmail = trimmed.Contains('@');

        if (isEmail)
            return trimmed;

        return new string(trimmed.Where(char.IsLetterOrDigit).ToArray());
    }

    private async Task<Payout?> FetchLockedPayoutAsync(string? txId, string? externalId, CancellationToken ct, string? acquirerTransactionId = null)
    {
        if (!string.IsNullOrEmpty(txId))
        {
            var payout = await dbContext.Payouts
                .Include(p => p.Merchant)
                .Include(p => p.PayoutAccount)
                .Include(p => p.MerchantAcquirer)
                    .ThenInclude(ma => ma!.Acquirer)
                .Where(p => p.AcquirerTransactionId == txId && p.Status == PayoutStatus.Confirming)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(ct);

            if (payout != null) return payout;
        }

        if (!string.IsNullOrEmpty(acquirerTransactionId))
        {
            var payout = await dbContext.Payouts
                .Include(p => p.Merchant)
                .Include(p => p.PayoutAccount)
                .Include(p => p.MerchantAcquirer)
                    .ThenInclude(ma => ma!.Acquirer)
                .Where(p => p.AcquirerTransactionId == acquirerTransactionId && p.Status == PayoutStatus.Confirming)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(ct);

            if (payout != null) return payout;
        }

        if (!string.IsNullOrEmpty(externalId))
        {
            var payoutIdStr = externalId.Replace("PAYOUT", "", StringComparison.OrdinalIgnoreCase);
            if (Guid.TryParse(payoutIdStr, out var payoutId))
            {
                return await dbContext.Payouts
                    .Include(p => p.Merchant)
                    .Include(p => p.PayoutAccount)
                    .Include(p => p.MerchantAcquirer)
                        .ThenInclude(ma => ma!.Acquirer)
                    .OrderBy(p => p.Id)
                    .FirstOrDefaultAsync(p => p.Id == payoutId && p.Status == PayoutStatus.Confirming, ct);
            }
        }

        return null;
    }

    private async Task<ProcessCashoutWebhookResult> HandlePayoutNotFoundOrLockedAsync(AcquirerCashoutWebhookData data, CancellationToken ct)
    {
        Payout? existingPayout = null;

        if (!string.IsNullOrEmpty(data.TxId))
        {
            existingPayout = await dbContext.Payouts
                .Where(p => p.AcquirerTransactionId == data.TxId)
                .OrderBy(p => p.Id)
                .Select(p => new Payout { Id = p.Id, Status = p.Status })
                .FirstOrDefaultAsync(ct);
        }

        if (existingPayout == null && !string.IsNullOrEmpty(data.ExternalId))
        {
            var payoutIdStr = data.ExternalId.Replace("PAYOUT", "", StringComparison.OrdinalIgnoreCase);
            if (Guid.TryParse(payoutIdStr, out var payoutId))
            {
                existingPayout = await dbContext.Payouts
                    .Where(p => p.Id == payoutId)
                    .OrderBy(p => p.Id)
                    .Select(p => new Payout { Id = p.Id, Status = p.Status })
                    .FirstOrDefaultAsync(ct);
            }
        }

        if (existingPayout == null && !string.IsNullOrEmpty(data.AcquirerTransactionId))
        {
            existingPayout = await dbContext.Payouts
                .Where(p => p.AcquirerTransactionId == data.AcquirerTransactionId)
                .OrderBy(p => p.Id)
                .Select(p => new Payout { Id = p.Id, Status = p.Status })
                .FirstOrDefaultAsync(ct);
        }

        if (existingPayout != null)
        {
            if (existingPayout.Status == PayoutStatus.Confirming)
            {
                return new ProcessCashoutWebhookResult
                {
                    Success = true,
                    PayoutId = existingPayout.Id,
                    Status = existingPayout.Status,
                    ErrorMessage = "Saque está sendo processado por outro fluxo"
                };
            }

            return new ProcessCashoutWebhookResult
            {
                Success = true,
                PayoutId = existingPayout.Id,
                Status = existingPayout.Status,
                ErrorMessage = $"Saque já processado com status {existingPayout.Status}"
            };
        }

        var platformResult = await TryProcessPlatformPayoutItemWebhookAsync(data, ct);
        if (platformResult != null)
        {
            return platformResult;
        }

        return new ProcessCashoutWebhookResult
        {
            Success = false,
            PayoutNotFound = true,
            ErrorMessage = "Payout não encontrado"
        };
    }

    private async Task ReleaseConfirmingLockAsync(Guid? lockedPayoutId, AcquirerCashoutWebhookData data, CancellationToken ct)
    {
        if (lockedPayoutId.HasValue)
        {
            await dbContext.Payouts
                .Where(p => p.Id == lockedPayoutId.Value && p.Status == PayoutStatus.Confirming)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, PayoutStatus.Processing)
                    .SetProperty(p => p.UpdatedAt, DateTime.UtcNow), ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(data.TxId))
        {
            await dbContext.Payouts
                .Where(p => p.AcquirerTransactionId == data.TxId
                    && p.Status == PayoutStatus.Confirming)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, PayoutStatus.Processing)
                    .SetProperty(p => p.UpdatedAt, DateTime.UtcNow), ct);
        }

        if (!string.IsNullOrWhiteSpace(data.AcquirerTransactionId))
        {
            await dbContext.Payouts
                .Where(p => p.AcquirerTransactionId == data.AcquirerTransactionId
                    && p.Status == PayoutStatus.Confirming)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, PayoutStatus.Processing)
                    .SetProperty(p => p.UpdatedAt, DateTime.UtcNow), ct);
        }
    }

    private async Task<ProcessCashoutWebhookResult?> TryProcessPlatformPayoutItemWebhookAsync(
        AcquirerCashoutWebhookData data,
        CancellationToken ct)
    {
        PlatformPayoutItem? item = null;

        if (!string.IsNullOrWhiteSpace(data.TxId))
        {
            item = await dbContext.PlatformPayoutItems
                .IgnoreQueryFilters()
                .Include(i => i.PlatformPayout)
                .Include(i => i.Acquirer)
                .Where(i => i.AcquirerPayoutId == data.TxId || i.AcquirerTransactionId == data.TxId)
                .OrderBy(i => i.Id)
                .FirstOrDefaultAsync(ct);
        }

        if (item == null && !string.IsNullOrWhiteSpace(data.ExternalId))
        {
            if (Guid.TryParse(data.ExternalId, out var payoutItemId))
            {
                item = await dbContext.PlatformPayoutItems
                    .IgnoreQueryFilters()
                    .Include(i => i.PlatformPayout)
                    .Include(i => i.Acquirer)
                    .OrderBy(i => i.Id)
                    .FirstOrDefaultAsync(i => i.Id == payoutItemId, ct);
            }
        }

        if (item == null)
        {
            return null;
        }

        var previousStatus = item.Status;

        if (item.Status is PlatformPayoutItemStatus.Completed or PlatformPayoutItemStatus.Failed or PlatformPayoutItemStatus.Cancelled)
        {
            return new ProcessCashoutWebhookResult
            {
                Success = true,
                PayoutId = item.PlatformPayoutId,
                Status = MapPlatformPayoutItemStatusToPayoutStatus(item.Status)
            };
        }

        item.AcquirerTransactionId = data.AcquirerTransactionId ?? item.AcquirerTransactionId;
        item.AcquirerPayoutId = string.IsNullOrWhiteSpace(item.AcquirerPayoutId) ? data.TxId : item.AcquirerPayoutId;
        item.PixEndToEndId = data.EndToEndId ?? item.PixEndToEndId;

        switch (data.Status)
        {
            case PayoutStatus.Completed:
                item.Status = PlatformPayoutItemStatus.Completed;
                item.CompletedAt = data.CompletedAt ?? DateTime.UtcNow;

                var completedResult = await ledgerService.RecordPlatformWithdrawalCompletedAsync(
                    item.PlatformPayoutId,
                    item.Id,
                    item.AcquirerId,
                    item.Amount,
                    item.AcquirerFee,
                    $"Saque da plataforma confirmado via webhook - E2E: {data.EndToEndId}");

                if (!completedResult.Success)
                {
                    return new ProcessCashoutWebhookResult
                    {
                        Success = false,
                        ErrorMessage = $"Falha ao registrar conclusão do saque da plataforma no ledger: {completedResult.ErrorMessage}"
                    };
                }
                break;

            case PayoutStatus.Cancelled:
                item.Status = PlatformPayoutItemStatus.Cancelled;
                item.FailureReason = data.RejectReason ?? "Saque cancelado na adquirente";

                var cancelledResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
                    item.PlatformPayoutId,
                    item.Id,
                    item.Amount,
                    item.FailureReason);

                if (!cancelledResult.Success)
                {
                    return new ProcessCashoutWebhookResult
                    {
                        Success = false,
                        ErrorMessage = $"Falha ao restaurar saldo do saque da plataforma no ledger: {cancelledResult.ErrorMessage}"
                    };
                }
                break;

            case PayoutStatus.Failed:
            case PayoutStatus.Rejected:
                item.Status = PlatformPayoutItemStatus.Failed;
                item.FailureReason = data.RejectReason ?? "Falha no processamento";

                var failedResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
                    item.PlatformPayoutId,
                    item.Id,
                    item.Amount,
                    item.FailureReason);

                if (!failedResult.Success)
                {
                    return new ProcessCashoutWebhookResult
                    {
                        Success = false,
                        ErrorMessage = $"Falha ao restaurar saldo do saque da plataforma no ledger: {failedResult.ErrorMessage}"
                    };
                }
                break;

            default:
                item.ProcessedAt = DateTime.UtcNow;
                break;
        }

        await dbContext.SaveChangesAsync(ct);

        await TryUpdatePlatformPayoutStatusAsync(item.PlatformPayoutId, ct);

        if (previousStatus == PlatformPayoutItemStatus.Processing
            && item.Status is PlatformPayoutItemStatus.Completed or PlatformPayoutItemStatus.Failed or PlatformPayoutItemStatus.Cancelled)
        {
            await NotifyAdminsAndRefreshPlatformBalanceAsync(item, ct);
        }

        return new ProcessCashoutWebhookResult
        {
            Success = true,
            PayoutId = item.PlatformPayoutId,
            Status = MapPlatformPayoutItemStatusToPayoutStatus(item.Status)
        };
    }

    private async Task TryUpdatePlatformPayoutStatusAsync(Guid platformPayoutId, CancellationToken ct)
    {
        var payout = await dbContext.PlatformPayouts
            .IgnoreQueryFilters()
            .Include(p => p.Items)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == platformPayoutId, ct);

        if (payout == null)
        {
            return;
        }

        var items = payout.Items.ToList();
        if (items.Any(i => i.Status == PlatformPayoutItemStatus.Processing))
        {
            return;
        }

        var allCompleted = items.All(i => i.Status == PlatformPayoutItemStatus.Completed);
        var allFailed = items.All(i => i.Status == PlatformPayoutItemStatus.Failed);
        var allCancelled = items.All(i => i.Status == PlatformPayoutItemStatus.Cancelled);

        if (allCompleted)
        {
            payout.Status = PlatformPayoutStatus.Completed;
            payout.CompletedAt ??= DateTime.UtcNow;
        }
        else if (allFailed)
        {
            payout.Status = PlatformPayoutStatus.Failed;
        }
        else if (allCancelled)
        {
            payout.Status = PlatformPayoutStatus.Cancelled;
            payout.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            payout.Status = PlatformPayoutStatus.PartiallyCompleted;
            payout.CompletedAt ??= DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);
    }

    private async Task NotifyAdminsAndRefreshPlatformBalanceAsync(PlatformPayoutItem item, CancellationToken ct)
    {
        if (!messagePublisher.IsEnabled)
        {
            return;
        }

        var adminUserIds = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Status == UserStatus.Active && (u.Role == UserRole.Admin || u.Role == UserRole.God))
            .Select(u => u.Id)
            .ToListAsync(ct);

        if (adminUserIds.Count == 0)
        {
            return;
        }

        var acquirerName = item.Acquirer?.Name ?? item.AcquirerId.ToString();
        var amountText = FormatUtils.FormatCurrency(item.Amount);
        var title = item.Status == PlatformPayoutItemStatus.Completed
            ? "Saque plataforma concluido"
            : "Saque plataforma falhou";
        var message = item.Status == PlatformPayoutItemStatus.Completed
            ? $"Saque plataforma concluido {amountText} ({acquirerName})."
            : $"Saque plataforma falhou {amountText} ({acquirerName}). Motivo: {item.FailureReason ?? "Nao informado"}.";

        await messagePublisher.PublishAsync(
            RabbitMQQueues.CreateBulkUserNotification,
            new CreateBulkUserNotificationMessage(
                UserIds: adminUserIds,
                NotificationType: NotificationType.System,
                StatusType: null,
                Priority: NotificationPriority.Normal,
                Title: title,
                Message: message,
                ActionUrl: "/panel/admin/platform-payouts",
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                SendInApp: true,
                SendPush: true,
                PushData: null));

        await messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessPlatformBalance,
            new ProcessPlatformBalanceMessage
            {
                AcquirerId = item.AcquirerId,
                Environment = item.PlatformPayout.Environment
            });
    }

    private async Task PublishCashoutWebhookIfConfiguredAsync(Payout payout, string eventType)
    {
        if (string.IsNullOrWhiteSpace(payout.CallbackUrl))
        {
            return;
        }

        await messagePublisher.PublishAsync(
            RabbitMQQueues.SendCashoutWebhook,
            payout.ToWebhookMessage(eventType));
    }
}

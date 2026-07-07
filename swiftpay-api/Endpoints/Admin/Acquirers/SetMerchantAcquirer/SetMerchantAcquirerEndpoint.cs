using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using CredentialUtils = swiftpay_api_core.Models.Acquirer.CredentialUtils;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Acquirers.SetMerchantAcquirer;

public sealed class SetAcquirerEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider,
    ISubmerchantProvisioningService submerchantProvisioningService
) : Endpoint<SetAcquirerRequest, SetAcquirerResponse>
{
    public override void Configure()
    {
        Post("merchant/{merchantId:guid}/acquirer");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SetAcquirerRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SetAcquirerResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new SetAcquirerResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new SetAcquirerResponse
            {
                Error = new("A organização precisa estar ativa para configurar uma adquirente.")
            }, 400, ct);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId && a.IsActive, ct);

        if (acquirer == null)
        {
            await Send.ResponseAsync(new SetAcquirerResponse
            {
                Error = new("Adquirente não encontrada ou inativa.")
            }, 404, ct);
            return;
        }

        var existingActiveAcquirer = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId && ma.IsActive, ct);

        Guid? previousAcquirerId = existingActiveAcquirer?.AcquirerId;
        string? previousAcquirerName = existingActiveAcquirer?.Acquirer?.Name;
        var isChangingDefaultAcquirer = existingActiveAcquirer != null && existingActiveAcquirer.AcquirerId != req.AcquirerId && req.SetAsDefault;

        var existingMerchantAcquirer = await dbContext.MerchantAcquirers
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId && ma.AcquirerId == req.AcquirerId, ct);

        var isSwitchingToReactivatedAcquirer = existingMerchantAcquirer != null
            && !existingMerchantAcquirer.IsActive
            && existingActiveAcquirer != null
            && existingActiveAcquirer.AcquirerId != existingMerchantAcquirer.AcquirerId;

        var shouldRelinkLegacyAccounts = isChangingDefaultAcquirer || isSwitchingToReactivatedAcquirer;

        if (shouldRelinkLegacyAccounts && existingActiveAcquirer != null)
        {
            await RelinkLegacyMerchantAccountsAsync(req.MerchantId, existingActiveAcquirer.Id, ct);
        }

        if (existingMerchantAcquirer != null)
        {
            var wasInactive = !existingMerchantAcquirer.IsActive;
            var wasNotDefault = !existingMerchantAcquirer.IsDefault;
            
            // Dynamic Credentials System
            if (req.Credentials != null)
            {
                // Trim values and filter out empty ones
                var trimmedCredentials = req.Credentials
                    .Where(kvp => !string.IsNullOrWhiteSpace(kvp.Value))
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Trim());
                    
                existingMerchantAcquirer.Credentials = trimmedCredentials.Count == 0 
                    ? null 
                    : CredentialUtils.SerializeCredentials(trimmedCredentials);
            }

            var ensureExistingSubmerchant = await submerchantProvisioningService.EnsureSubmerchantProvisionedAsync(
                merchant,
                existingMerchantAcquirer,
                acquirer,
                ct: ct);

            if (!ensureExistingSubmerchant.Success)
            {
                await Send.ResponseAsync(new SetAcquirerResponse
                {
                    Error = new(ensureExistingSubmerchant.ErrorMessage ?? "Falha ao criar subconta da organização na IP.")
                }, 400, ct);
                return;
            }
            
            if (req.SetAsDefault || wasInactive)
            {
                await ActivateMerchantAcquirerAsync(req.MerchantId, existingMerchantAcquirer, ct);
            }
            else
            {
                existingMerchantAcquirer.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(ct);
            }

            if (wasInactive)
            {
                await RecordAcquirerHistoryAsync(
                    req.MerchantId,
                    MerchantAcquirerChangeAction.AcquirerReactivated,
                    null, null,
                    req.AcquirerId, acquirer.Name,
                    userId.Value,
                    req.Reason ?? "Adquirente reativada",
                    ct);
            }
            else if (isChangingDefaultAcquirer && wasNotDefault)
            {
                await RecordAcquirerHistoryAsync(
                    req.MerchantId,
                    MerchantAcquirerChangeAction.DefaultChanged,
                    previousAcquirerId, previousAcquirerName,
                    req.AcquirerId, acquirer.Name,
                    userId.Value,
                    req.Reason ?? "Alteração de adquirente padrão",
                    ct);
            }

            await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Adquirente {acquirer.Name} atualizada para o merchant {merchant.Id}" });

            _ = notificationService.CreateSystemNotificationAsync(
                req.MerchantId,
                "Adquirente atualizada",
                $"As configurações da adquirente {acquirer.Name} foram atualizadas pela equipe SwiftPay."
            );

            if (isChangingDefaultAcquirer && previousAcquirerId.HasValue)
            {
                await InvalidatePlatformBalanceCacheAsync(previousAcquirerId.Value, ct);
            }
            await InvalidatePlatformBalanceCacheAsync(req.AcquirerId, ct);

            await Send.OkAsync(new SetAcquirerResponse
            {
                Data = new SetAcquirerData(existingMerchantAcquirer.Id, "Adquirente atualizada com sucesso.")
            }, ct);
            return;
        }

        // Dynamic Credentials System - merge request with acquirer defaults
        var credentials = CredentialUtils.MergeCredentials(
            req.Credentials, 
            CredentialUtils.ParseCredentials(acquirer.DefaultCredentials));

        // Check if credentials have data
        var hasCredentials = credentials != null && credentials.Count > 0 && credentials.Values.Any(v => !string.IsNullOrWhiteSpace(v));

        if (!hasCredentials)
        {
            await Send.ResponseAsync(new SetAcquirerResponse
            {
                Error = new("Credenciais são obrigatórias. Configure as credenciais dinâmicas da adquirente.")
            }, 400, ct);
            return;
        }

        var isFirstAcquirer = !await dbContext.MerchantAcquirers
            .AnyAsync(ma => ma.MerchantId == req.MerchantId, ct);

        var merchantAcquirer = new MerchantAcquirer
        {
            MerchantId = req.MerchantId,
            AcquirerId = req.AcquirerId,
            Credentials = credentials != null && credentials.Count > 0 
                ? CredentialUtils.SerializeCredentials(credentials) 
                : null,
            IsActive = req.SetAsDefault,
            IsDefault = req.SetAsDefault,
            ActivatedAt = req.SetAsDefault ? DateTime.UtcNow : null,
            PixInFeeMode = acquirer.PixInFeeMode,
            PixInFeeFixed = acquirer.PixInFeeFixed,
            PixInFeePercentage = acquirer.PixInFeePercentage,
            BoletoInFeeMode = acquirer.BoletoInFeeMode,
            BoletoInFeeFixed = acquirer.BoletoInFeeFixed,
            BoletoInFeePercentage = acquirer.BoletoInFeePercentage,
            PayoutFeeMode = acquirer.PayoutFeeMode,
            PayoutFeeFixed = acquirer.PayoutFeeFixed,
            PayoutFeePercentage = acquirer.PayoutFeePercentage
        };

        var ensureCreatedSubmerchant = await submerchantProvisioningService.EnsureSubmerchantProvisionedAsync(
            merchant,
            merchantAcquirer,
            acquirer,
            ct: ct);

        if (!ensureCreatedSubmerchant.Success)
        {
            await Send.ResponseAsync(new SetAcquirerResponse
            {
                Error = new(ensureCreatedSubmerchant.ErrorMessage ?? "Falha ao criar subconta da organização na IP.")
            }, 400, ct);
            return;
        }

        if (req.SetAsDefault)
        {
            await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

            await DeactivateMerchantAcquirersAsync(req.MerchantId, null, ct);

            dbContext.MerchantAcquirers.Add(merchantAcquirer);
            await dbContext.SaveChangesAsync(ct);

            await transaction.CommitAsync(ct);
        }
        else
        {
            dbContext.MerchantAcquirers.Add(merchantAcquirer);
            await dbContext.SaveChangesAsync(ct);
        }

        if (isFirstAcquirer)
        {
            await RecordAcquirerHistoryAsync(
                req.MerchantId,
                MerchantAcquirerChangeAction.InitialAssignment,
                null, null,
                req.AcquirerId, acquirer.Name,
                userId.Value,
                req.Reason ?? "Primeira adquirente configurada",
                ct);
        }
        else if (isChangingDefaultAcquirer)
        {
            await RecordAcquirerHistoryAsync(
                req.MerchantId,
                MerchantAcquirerChangeAction.DefaultChanged,
                previousAcquirerId, previousAcquirerName,
                req.AcquirerId, acquirer.Name,
                userId.Value,
                req.Reason ?? "Alteração de adquirente padrão",
                ct);
        }
        else
        {
            await RecordAcquirerHistoryAsync(
                req.MerchantId,
                MerchantAcquirerChangeAction.AcquirerAdded,
                null, null,
                req.AcquirerId, acquirer.Name,
                userId.Value,
                req.Reason ?? "Nova adquirente adicionada",
                ct);
        }

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Adquirente {acquirer.Name} configurada para o merchant {merchant.Id}" });

        if (isChangingDefaultAcquirer && previousAcquirerId.HasValue)
        {
            await InvalidatePlatformBalanceCacheAsync(previousAcquirerId.Value, ct);
        }
        await InvalidatePlatformBalanceCacheAsync(req.AcquirerId, ct);

        await Send.ResponseAsync(new SetAcquirerResponse
        {
            Data = new SetAcquirerData(merchantAcquirer.Id, "Adquirente configurada com sucesso.")
        }, 201, ct);
    }

    private async Task RecordAcquirerHistoryAsync(
        Guid merchantId,
        MerchantAcquirerChangeAction action,
        Guid? previousAcquirerId,
        string? previousAcquirerName,
        Guid? newAcquirerId,
        string? newAcquirerName,
        Guid changedByUserId,
        string reason,
        CancellationToken ct)
    {
        var history = new MerchantAcquirerChangeHistory
        {
            MerchantId = merchantId,
            Action = action,
            PreviousAcquirerId = previousAcquirerId,
            PreviousAcquirerName = previousAcquirerName,
            NewAcquirerId = newAcquirerId,
            NewAcquirerName = newAcquirerName,
            ChangedByUserId = changedByUserId,
            Reason = reason,
            IsLegacyRecord = false
        };

        dbContext.MerchantAcquirerChangeHistories.Add(history);
        await dbContext.SaveChangesAsync(ct);
    }

    private async Task InvalidatePlatformBalanceCacheAsync(Guid acquirerId, CancellationToken ct)
    {
        var environment = environmentProvider.CurrentEnvironment;

        var cache = await dbContext.PlatformBalanceCaches
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.AcquirerId == acquirerId && c.Environment == environment, ct);

        if (cache != null)
        {
            cache.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            cache.NextProcessAt = null;
            cache.IsProcessing = false;
            await dbContext.SaveChangesAsync(ct);
        }

        await messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessPlatformBalance,
            new ProcessPlatformBalanceMessage
            {
                AcquirerId = acquirerId,
                Environment = environment
            },
            ct);
    }

    private async Task RelinkLegacyMerchantAccountsAsync(Guid merchantId, Guid previousMerchantAcquirerId, CancellationToken ct)
    {
        var legacyAccounts = await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId == merchantId
                && a.MerchantAcquirerId == null
                && (a.Type == AccountType.MerchantAvailable
                    || a.Type == AccountType.MerchantPending
                    || a.Type == AccountType.MerchantBlocked
                    || a.Type == AccountType.MerchantPayoutsOut))
            .ToListAsync(ct);

        if (legacyAccounts.Count == 0)
        {
            return;
        }

        var legacyTypes = legacyAccounts.Select(a => a.Type).Distinct().ToList();
        var legacyEnvironments = legacyAccounts.Select(a => a.Environment).Distinct().ToList();

        var targetAccounts = await dbContext.Accounts
            .IgnoreQueryFilters()
            .Where(a => a.MerchantId == merchantId
                && a.MerchantAcquirerId == previousMerchantAcquirerId
                && legacyTypes.Contains(a.Type)
                && legacyEnvironments.Contains(a.Environment))
            .ToListAsync(ct);

        var targetMap = targetAccounts.ToDictionary(
            a => (a.Type, a.Environment),
            a => a);

        var now = DateTime.UtcNow;

        foreach (var legacyAccount in legacyAccounts)
        {
            if (targetMap.TryGetValue((legacyAccount.Type, legacyAccount.Environment), out var targetAccount))
            {
                if (legacyAccount.Balance != 0)
                {
                    targetAccount.Balance += legacyAccount.Balance;
                    targetAccount.UpdatedAt = now;
                }

                legacyAccount.Balance = 0;
                legacyAccount.UpdatedAt = now;
                continue;
            }

            legacyAccount.MerchantAcquirerId = previousMerchantAcquirerId;
            legacyAccount.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(ct);
    }

    private async Task ActivateMerchantAcquirerAsync(Guid merchantId, MerchantAcquirer targetMerchantAcquirer, CancellationToken ct)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

        await DeactivateMerchantAcquirersAsync(merchantId, targetMerchantAcquirer.Id, ct);

        var now = DateTime.UtcNow;
        targetMerchantAcquirer.IsActive = true;
        targetMerchantAcquirer.IsDefault = true;
        targetMerchantAcquirer.ActivatedAt = now;
        targetMerchantAcquirer.UpdatedAt = now;

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
    }

    private Task DeactivateMerchantAcquirersAsync(Guid merchantId, Guid? exceptMerchantAcquirerId, CancellationToken ct)
    {
        return dbContext.MerchantAcquirers
            .Where(ma => ma.MerchantId == merchantId
                && (exceptMerchantAcquirerId == null || ma.Id != exceptMerchantAcquirerId)
                && (ma.IsActive || ma.IsDefault))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(ma => ma.IsActive, false)
                .SetProperty(ma => ma.IsDefault, false)
                .SetProperty(ma => ma.UpdatedAt, DateTime.UtcNow), ct);
    }
}

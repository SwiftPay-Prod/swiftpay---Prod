using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Utils;
using CredentialUtils = swiftpay_api_core.Models.Acquirer.CredentialUtils;

namespace swiftpay_api.Endpoints.Merchants.Settings.SwitchNominal;

public sealed class SwitchNominalEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IMessagePublisher messagePublisher,
    IEnvironmentProvider environmentProvider
) : Endpoint<SwitchNominalRequest, SwitchNominalResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/nominals/current");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(SwitchNominalRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .Include(m => m.MerchantSettings)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("Organizacao nao encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A organizacao precisa estar ativa para trocar a nominal.")
            }, 400, ct);
            return;
        }

        var platformSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (platformSettings == null)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("Configuracoes da plataforma nao encontradas.")
            }, 500, ct);
            return;
        }

        if (!platformSettings.SelfNominalSwitchEnabled)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A troca de nominal por autoatendimento esta bloqueada para esta organizacao.")
            }, 403, ct);
            return;
        }

        if (!merchant.MerchantKyc?.OperationType.HasValue ?? true)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("O tipo de operacao da organizacao ainda nao foi definido.")
            }, 400, ct);
            return;
        }

        var merchantOperationType = merchant.MerchantKyc!.OperationType!.Value;
        var acquirerOperationType = MapToAcquirerOperationType(merchantOperationType);

        var targetMerchantAcquirer = await ResolveTargetMerchantAcquirerAsync(req, ct);

        if (targetMerchantAcquirer == null)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("Nominal nao encontrada para esta organizacao.")
            }, 404, ct);
            return;
        }

        if (!targetMerchantAcquirer.Acquirer.IsActive)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A adquirente da nominal selecionada esta inativa.")
            }, 400, ct);
            return;
        }

        if (targetMerchantAcquirer.Acquirer.HideFromMerchantNominalSelection)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A nominal selecionada nao esta disponivel para autoatendimento desta organizacao.")
            }, 400, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(targetMerchantAcquirer.Acquirer.Nominal))
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A adquirente selecionada nao possui nominal configurada.")
            }, 400, ct);
            return;
        }

        if (!targetMerchantAcquirer.Acquirer.OperationTypes.Contains(acquirerOperationType))
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A nominal selecionada nao e compativel com o tipo de operacao da sua organizacao.")
            }, 400, ct);
            return;
        }

        var merchantSettings = merchant.MerchantSettings;

        var isTargetFeeCompatible = NominalFeeCompatibilityUtils.IsAcquirerFeeCompatible(
            targetMerchantAcquirer.Acquirer,
            targetMerchantAcquirer,
            merchantSettings,
            platformSettings);

        if (!isTargetFeeCompatible)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("A nominal selecionada possui taxa maior que a taxa efetiva da sua organização em um ou mais métodos.")
            }, 400, ct);
            return;
        }

        var currentMerchantAcquirer = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId && ma.IsActive, ct);

        if (currentMerchantAcquirer == null)
        {
            await Send.ResponseAsync(new SwitchNominalResponse
            {
                Error = new("Nenhuma nominal ativa foi encontrada para esta organizacao.")
            }, 404, ct);
            return;
        }

        if (currentMerchantAcquirer.Id == targetMerchantAcquirer.Id)
        {
            await Send.OkAsync(new SwitchNominalResponse
            {
                Data = new SwitchNominalData
                {
                    MerchantAcquirerId = targetMerchantAcquirer.Id,
                    Nominal = targetMerchantAcquirer.Acquirer.Nominal ?? string.Empty,
                    Message = "Essa nominal ja esta ativa para a sua organizacao."
                }
            }, ct);
            return;
        }

        var previousAcquirerId = currentMerchantAcquirer.AcquirerId;
        var previousAcquirerName = currentMerchantAcquirer.Acquirer.Name;
        var previousMerchantAcquirerId = currentMerchantAcquirer.Id;

        await RelinkLegacyMerchantAccountsAsync(req.MerchantId, previousMerchantAcquirerId, ct);

        await ActivateMerchantAcquirerAsync(req.MerchantId, targetMerchantAcquirer, ct);

        await RecordAcquirerHistoryAsync(
            req.MerchantId,
            MerchantAcquirerChangeAction.DefaultChanged,
            previousAcquirerId,
            previousAcquirerName,
            targetMerchantAcquirer.AcquirerId,
            targetMerchantAcquirer.Acquirer.Name,
            userId.Value,
            "Alteracao de nominal pelo merchant",
            ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Merchant {req.MerchantId} trocou nominal para {targetMerchantAcquirer.Acquirer.Nominal}"
        });

        await InvalidatePlatformBalanceCacheAsync(previousAcquirerId, ct);
        await InvalidatePlatformBalanceCacheAsync(targetMerchantAcquirer.AcquirerId, ct);

        await Send.OkAsync(new SwitchNominalResponse
        {
            Data = new SwitchNominalData
            {
                MerchantAcquirerId = targetMerchantAcquirer.Id,
                Nominal = targetMerchantAcquirer.Acquirer.Nominal ?? string.Empty,
                Message = "Nominal alterada com sucesso."
            }
        }, ct);
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
            .Where(a => a.MerchantId == merchantId
                && a.MerchantAcquirerId == null
                && (a.Type == AccountType.MerchantAvailable
                    || a.Type == AccountType.MerchantPending
                    || a.Type == AccountType.MerchantBlocked
                    || a.Type == AccountType.MerchantReserved
                    || a.Type == AccountType.MerchantPayoutsOut))
            .ToListAsync(ct);

        if (legacyAccounts.Count == 0)
        {
            return;
        }

        var legacyTypes = legacyAccounts.Select(a => a.Type).Distinct().ToList();
        var legacyEnvironments = legacyAccounts.Select(a => a.Environment).Distinct().ToList();

        var targetAccounts = await dbContext.Accounts
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

    private async Task<MerchantAcquirer?> ResolveTargetMerchantAcquirerAsync(
        SwitchNominalRequest req,
        CancellationToken ct)
    {
        if (req.MerchantAcquirerId.HasValue)
        {
            return await dbContext.MerchantAcquirers
                .Include(ma => ma.Acquirer)
                .OrderBy(ma => ma.Id)
                .FirstOrDefaultAsync(ma => ma.Id == req.MerchantAcquirerId.Value && ma.MerchantId == req.MerchantId, ct);
        }

        if (!req.AcquirerId.HasValue)
        {
            return null;
        }

        var existing = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId && ma.AcquirerId == req.AcquirerId.Value, ct);

        if (existing != null)
        {
            return existing;
        }

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == req.AcquirerId.Value && a.IsActive, ct);

        if (acquirer == null)
        {
            return null;
        }

        var created = new MerchantAcquirer
        {
            MerchantId = req.MerchantId,
            AcquirerId = acquirer.Id,
            Credentials = CredentialUtils.ParseCredentials(acquirer.DefaultCredentials) is var defaultCredentials && defaultCredentials.Count > 0
                ? CredentialUtils.SerializeCredentials(defaultCredentials)
                : null,
            IsActive = false,
            IsDefault = false,
            ActivatedAt = null,
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

        dbContext.MerchantAcquirers.Add(created);
        await dbContext.SaveChangesAsync(ct);

        return await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.Id == created.Id, ct);
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

    private static AcquirerOperationType MapToAcquirerOperationType(MerchantKycOperationType operationType)
    {
        return operationType == MerchantKycOperationType.Black
            ? AcquirerOperationType.Black
            : AcquirerOperationType.White;
    }
}

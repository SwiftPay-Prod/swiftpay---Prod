using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using CredentialUtils = swiftpay_api_core.Models.Acquirer.CredentialUtils;

namespace swiftpay_api.Endpoints.Merchants.Settings.UpdateNominalAbTest;

public sealed class UpdateNominalAbTestEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<UpdateNominalAbTestRequest, UpdateNominalAbTestResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/nominals/ab-test");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateNominalAbTestRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .Include(m => m.MerchantKyc)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new("Organizacao nao encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new("A organizacao precisa estar ativa para configurar teste A/B.")
            }, 400, ct);
            return;
        }

        if (!merchant.MerchantKyc?.OperationType.HasValue ?? true)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new("O tipo de operacao da organizacao ainda nao foi definido.")
            }, 400, ct);
            return;
        }

        var merchantOperationType = merchant.MerchantKyc!.OperationType!.Value;

        var currentEnvironment = environmentProvider.CurrentEnvironment;

        var activeTest = await dbContext.MerchantNominalAbTests
            .FirstOrDefaultAsync(t => t.MerchantId == req.MerchantId && t.IsActive, ct);

        if (!req.Enabled)
        {
            if (activeTest == null)
            {
                await Send.OkAsync(new UpdateNominalAbTestResponse
                {
                    Data = new NominalAbTestData
                    {
                        IsActive = false,
                        VariantAWeightPercent = 50.00m,
                        VariantBWeightPercent = 50.00m,
                        IsAutoFinished = false,
                        Message = "Nao ha teste A/B ativo para esta organizacao."
                    }
                }, ct);
                return;
            }

            if (!req.WinnerMerchantAcquirerId.HasValue)
            {
                await Send.ResponseAsync(new UpdateNominalAbTestResponse
                {
                    Error = new("Selecione a nominal que deve permanecer ativa ao encerrar o teste A/B.")
                }, 400, ct);
                return;
            }

            var winnerMerchantAcquirerId = req.WinnerMerchantAcquirerId.Value;
            var winnerCandidate = await dbContext.MerchantAcquirers
                .Include(ma => ma.Acquirer)
                .OrderBy(ma => ma.Id)
                .FirstOrDefaultAsync(ma => ma.MerchantId == req.MerchantId
                    && ma.Id == winnerMerchantAcquirerId, ct);

            if (winnerCandidate == null)
            {
                await Send.ResponseAsync(new UpdateNominalAbTestResponse
                {
                    Error = new("A nominal selecionada para permanecer ativa nao pertence a organizacao.")
                }, 400, ct);
                return;
            }

            if (winnerCandidate.Id != activeTest.VariantAMerchantAcquirerId
                && winnerCandidate.Id != activeTest.VariantBMerchantAcquirerId)
            {
                await Send.ResponseAsync(new UpdateNominalAbTestResponse
                {
                    Error = new("A nominal escolhida precisa ser a variante A ou B do teste ativo.")
                }, 400, ct);
                return;
            }

            if (!winnerCandidate.Acquirer.IsActive)
            {
                await Send.ResponseAsync(new UpdateNominalAbTestResponse
                {
                    Error = new("A adquirente da nominal selecionada esta inativa.")
                }, 400, ct);
                return;
            }

            if (winnerCandidate.Acquirer.HideFromMerchantNominalSelection)
            {
                await Send.ResponseAsync(new UpdateNominalAbTestResponse
                {
                    Error = new("A nominal selecionada nao esta disponivel para autoatendimento desta organizacao.")
                }, 400, ct);
                return;
            }

            await ActivateMerchantAcquirerAsync(req.MerchantId, winnerCandidate, ct);

            activeTest.IsActive = false;
            activeTest.EndedAt = DateTime.UtcNow;
            activeTest.EndedByUserId = userId.Value;
            activeTest.WinnerMerchantAcquirerId = winnerMerchantAcquirerId;
            activeTest.IsAutoFinished = false;
            activeTest.EndReason = "Desativado manualmente pela organizacao";
            activeTest.UpdatedAt = DateTime.UtcNow;

            await dbContext.SaveChangesAsync(ct);

            await Send.OkAsync(new UpdateNominalAbTestResponse
            {
                Data = new NominalAbTestData
                {
                    IsActive = false,
                    VariantAWeightPercent = activeTest.VariantAWeightPercent,
                    VariantBWeightPercent = decimal.Round(100.00m - activeTest.VariantAWeightPercent, 2),
                    EndedAt = activeTest.EndedAt,
                    WinnerMerchantAcquirerId = activeTest.WinnerMerchantAcquirerId,
                    IsAutoFinished = activeTest.IsAutoFinished,
                    LimitType = activeTest.LimitType,
                    MaxDurationDays = activeTest.MaxDurationDays,
                    MaxTransactions = activeTest.MaxTransactions,
                    Message = "Teste A/B desativado com sucesso."
                }
            }, ct);
            return;
        }

        var variantAResult = await ResolveVariantMerchantAcquirerAsync(
            req.MerchantId,
            merchantOperationType,
            req.VariantAMerchantAcquirerId,
            req.VariantAAcquirerId,
            ct);

        if (variantAResult.ErrorMessage != null)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new(variantAResult.ErrorMessage)
            }, 400, ct);
            return;
        }

        var variantBResult = await ResolveVariantMerchantAcquirerAsync(
            req.MerchantId,
            merchantOperationType,
            req.VariantBMerchantAcquirerId,
            req.VariantBAcquirerId,
            ct);

        if (variantBResult.ErrorMessage != null)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new(variantBResult.ErrorMessage)
            }, 400, ct);
            return;
        }

        var variantA = variantAResult.MerchantAcquirer;
        var variantB = variantBResult.MerchantAcquirer;

        if (variantA == null || variantB == null)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new("Nao foi possivel resolver as nominais selecionadas para o teste A/B.")
            }, 400, ct);
            return;
        }

        if (variantA.Id == variantB.Id)
        {
            await Send.ResponseAsync(new UpdateNominalAbTestResponse
            {
                Error = new("As nominais A e B devem ser diferentes.")
            }, 400, ct);
            return;
        }

        var variantAId = variantA.Id;
        var variantBId = variantB.Id;
        var variantAWeight = decimal.Round(req.VariantAWeightPercent ?? 50.00m, 2);

        var limitType = req.LimitType ?? MerchantNominalAbTestLimitType.Days;
        var maxDurationDays = limitType == MerchantNominalAbTestLimitType.Days
            ? req.MaxDurationDays
            : null;
        var maxTransactions = limitType == MerchantNominalAbTestLimitType.Transactions
            ? req.MaxTransactions
            : null;

        if (activeTest != null)
        {
            activeTest.IsActive = false;
            activeTest.EndedAt = DateTime.UtcNow;
            activeTest.EndedByUserId = userId.Value;
            activeTest.EndReason = "Substituido por um novo teste A/B";
            activeTest.UpdatedAt = DateTime.UtcNow;
        }

        var now = DateTime.UtcNow;
        var newTest = new MerchantNominalAbTest
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            Environment = currentEnvironment,
            IsActive = true,
            VariantAMerchantAcquirerId = variantAId,
            VariantBMerchantAcquirerId = variantBId,
            VariantAWeightPercent = variantAWeight,
            LimitType = limitType,
            MaxDurationDays = maxDurationDays,
            MaxTransactions = maxTransactions,
            StartedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.MerchantNominalAbTests.Add(newTest);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateNominalAbTestResponse
        {
            Data = new NominalAbTestData
            {
                IsActive = true,
                VariantAMerchantAcquirerId = newTest.VariantAMerchantAcquirerId,
                VariantBMerchantAcquirerId = newTest.VariantBMerchantAcquirerId,
                VariantAWeightPercent = newTest.VariantAWeightPercent,
                VariantBWeightPercent = decimal.Round(100.00m - newTest.VariantAWeightPercent, 2),
                StartedAt = newTest.StartedAt,
                IsAutoFinished = false,
                LimitType = newTest.LimitType,
                MaxDurationDays = newTest.MaxDurationDays,
                MaxTransactions = newTest.MaxTransactions,
                Message = "Teste A/B ativado com sucesso."
            }
        }, ct);
    }

    private async Task<(MerchantAcquirer? MerchantAcquirer, string? ErrorMessage)> ResolveVariantMerchantAcquirerAsync(
        Guid merchantId,
        MerchantKycOperationType merchantOperationType,
        Guid? merchantAcquirerId,
        Guid? acquirerId,
        CancellationToken ct)
    {
        var acquirerOperationType = MapToAcquirerOperationType(merchantOperationType);

        if (merchantAcquirerId.HasValue)
        {
            var linked = await dbContext.MerchantAcquirers
                .Include(ma => ma.Acquirer)
                .OrderBy(ma => ma.Id)
                .FirstOrDefaultAsync(ma => ma.MerchantId == merchantId
                    && ma.Id == merchantAcquirerId.Value, ct);

            if (linked == null)
            {
                return (null, "As nominais selecionadas nao pertencem a organizacao.");
            }

            if (!linked.Acquirer.IsActive)
            {
                return (null, "As adquirentes das nominais selecionadas precisam estar ativas para iniciar o teste A/B.");
            }

            if (linked.Acquirer.HideFromMerchantNominalSelection)
            {
                return (null, "A nominal selecionada nao esta disponivel para autoatendimento desta organizacao.");
            }

            if (!linked.Acquirer.OperationTypes.Contains(acquirerOperationType))
            {
                return (null, "A nominal selecionada nao e compativel com o tipo de operacao da sua organizacao.");
            }

            return (linked, null);
        }

        if (!acquirerId.HasValue)
        {
            return (null, "Informe as variantes A e B para iniciar o teste A/B.");
        }

        var existing = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == merchantId
                && ma.AcquirerId == acquirerId.Value, ct);

        if (existing != null)
        {
            if (!existing.Acquirer.IsActive)
            {
                return (null, "As adquirentes das nominais selecionadas precisam estar ativas para iniciar o teste A/B.");
            }

            if (existing.Acquirer.HideFromMerchantNominalSelection)
            {
                return (null, "A nominal selecionada nao esta disponivel para autoatendimento desta organizacao.");
            }

            if (!existing.Acquirer.OperationTypes.Contains(acquirerOperationType))
            {
                return (null, "A nominal selecionada nao e compativel com o tipo de operacao da sua organizacao.");
            }

            return (existing, null);
        }

        var acquirer = await dbContext.Acquirers
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(a => a.Id == acquirerId.Value && a.IsActive, ct);

        if (acquirer == null)
        {
            return (null, "As adquirentes das nominais selecionadas precisam estar ativas para iniciar o teste A/B.");
        }

        if (string.IsNullOrWhiteSpace(acquirer.Nominal))
        {
            return (null, "A adquirente selecionada nao possui nominal configurada.");
        }

        if (acquirer.HideFromMerchantNominalSelection)
        {
            return (null, "A nominal selecionada nao esta disponivel para autoatendimento desta organizacao.");
        }

        if (!acquirer.OperationTypes.Contains(acquirerOperationType))
        {
            return (null, "A nominal selecionada nao e compativel com o tipo de operacao da sua organizacao.");
        }

        var created = new MerchantAcquirer
        {
            MerchantId = merchantId,
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

        var createdLinked = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.Id == created.Id, ct);

        return createdLinked == null
            ? (null, "Nao foi possivel criar vinculo para a nominal selecionada.")
            : (createdLinked, null);
    }

    private static AcquirerOperationType MapToAcquirerOperationType(MerchantKycOperationType operationType)
    {
        return operationType == MerchantKycOperationType.Black
            ? AcquirerOperationType.Black
            : AcquirerOperationType.White;
    }

    private async Task ActivateMerchantAcquirerAsync(Guid merchantId, MerchantAcquirer targetMerchantAcquirer, CancellationToken ct)
    {
        var currentMerchantAcquirer = await dbContext.MerchantAcquirers
            .Include(ma => ma.Acquirer)
            .OrderBy(ma => ma.Id)
            .FirstOrDefaultAsync(ma => ma.MerchantId == merchantId && ma.IsActive, ct);

        if (currentMerchantAcquirer != null && currentMerchantAcquirer.Id != targetMerchantAcquirer.Id)
        {
            await RelinkLegacyMerchantAccountsAsync(merchantId, currentMerchantAcquirer.Id, ct);
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);

        await dbContext.MerchantAcquirers
            .Where(ma => ma.MerchantId == merchantId
                && ma.Id != targetMerchantAcquirer.Id
                && (ma.IsActive || ma.IsDefault))
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(ma => ma.IsActive, false)
                .SetProperty(ma => ma.IsDefault, false)
                .SetProperty(ma => ma.UpdatedAt, DateTime.UtcNow), ct);

        var now = DateTime.UtcNow;
        targetMerchantAcquirer.IsActive = true;
        targetMerchantAcquirer.IsDefault = true;
        targetMerchantAcquirer.ActivatedAt = now;
        targetMerchantAcquirer.UpdatedAt = now;

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);
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
}

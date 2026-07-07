using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Balance.CreatePlatformBalanceAdjustment;

public sealed class CreatePlatformBalanceAdjustmentEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<CreatePlatformBalanceAdjustmentRequest, CreatePlatformBalanceAdjustmentResponse>
{
    public override void Configure()
    {
        Post("balance/adjustment");
        Group<AdminGroup>();
        Roles(nameof(UserRole.God));
    }

    public override async Task HandleAsync(CreatePlatformBalanceAdjustmentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        if (req.Scope == AdjustmentScope.Platform)
        {
            await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
            {
                Error = new("Ajustes globais da plataforma não são mais suportados. Use ajuste por adquirente no alvo SafefyProfit.")
            }, 400, ct);
            return;
        }

        if (req.Scope == AdjustmentScope.Acquirer)
        {
            var acquirerExists = await dbContext.Acquirers
                .AnyAsync(a => a.Id == req.AcquirerId!.Value, ct);

            if (!acquirerExists)
            {
                await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
                {
                    Error = new("Adquirente não encontrada.")
                }, 404, ct);
                return;
            }

            var result = req.AcquirerTarget == AcquirerAdjustmentTarget.SafefyProfit
                ? await ledgerService.RecordAcquirerSafefyProfitAdjustmentAsync(
                    req.AcquirerId!.Value,
                    req.Amount,
                    req.IsCredit,
                    req.Reason)
                : await ledgerService.RecordAcquirerAdjustmentAsync(
                    req.AcquirerId!.Value,
                    req.Amount,
                    req.IsCredit,
                    req.Reason);

            if (!result.Success)
            {
                await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
                {
                    Error = new(result.ErrorMessage ?? "Erro ao registrar ajuste no ledger.")
                }, 500, ct);
                return;
            }

            await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
            {
                Data = new AdminPlatformBalanceAdjustmentData
                {
                    TransactionId = result.TransactionId ?? string.Empty,
                    Scope = AdjustmentScope.Acquirer,
                    AcquirerId = req.AcquirerId,
                    AcquirerTarget = req.AcquirerTarget,
                    Amount = req.Amount,
                    IsCredit = req.IsCredit,
                    Reason = req.Reason,
                    NewTargetBalance = result.NewBalance ?? 0,
                    CreatedAt = DateTime.UtcNow
                },
                Message = req.AcquirerTarget switch
                {
                    AcquirerAdjustmentTarget.SafefyProfit => req.IsCredit
                        ? $"Crédito de {req.Amount / 100m:C} registrado no lucro Safefy da adquirente."
                        : $"Débito de {req.Amount / 100m:C} registrado no lucro Safefy da adquirente.",
                    AcquirerAdjustmentTarget.MerchantBalance => req.IsCredit
                        ? $"Crédito de {req.Amount / 100m:C} registrado no saldo global das organizações da adquirente."
                        : $"Débito de {req.Amount / 100m:C} registrado no saldo global das organizações da adquirente.",
                    _ => req.IsCredit
                        ? $"Crédito de {req.Amount / 100m:C} registrado na adquirente."
                        : $"Débito de {req.Amount / 100m:C} registrado na adquirente."
                }
            }, 201, ct);
        }
        else if (req.Scope == AdjustmentScope.Merchant)
        {
            var merchantExists = await dbContext.Merchants
                .AnyAsync(m => m.Id == req.MerchantId!.Value, ct);

            if (!merchantExists)
            {
                await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
                {
                    Error = new("Organização não encontrada.")
                }, 404, ct);
                return;
            }

            var result = await ledgerService.RecordMerchantAdjustmentAsync(
                req.MerchantId!.Value,
                req.Environment!.Value,
                req.Amount,
                req.IsCredit,
                req.Reason,
                req.MerchantAcquirerId);

            if (!result.Success)
            {
                await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
                {
                    Error = new(result.ErrorMessage ?? "Erro ao registrar ajuste no ledger.")
                }, 500, ct);
                return;
            }

            await Send.ResponseAsync(new CreatePlatformBalanceAdjustmentResponse
            {
                Data = new AdminPlatformBalanceAdjustmentData
                {
                    TransactionId = result.TransactionId ?? string.Empty,
                    Scope = AdjustmentScope.Merchant,
                    MerchantId = req.MerchantId,
                    Environment = req.Environment,
                    Amount = req.Amount,
                    IsCredit = req.IsCredit,
                    Reason = req.Reason,
                    NewTargetBalance = result.NewBalance ?? 0,
                    NewPlatformBalance = result.PlatformBalance,
                    MerchantAcquirerId = req.MerchantAcquirerId,
                    CreatedAt = DateTime.UtcNow
                },
                Message = req.IsCredit
                    ? $"Crédito de {req.Amount / 100m:C} registrado na organização."
                    : $"Débito de {req.Amount / 100m:C} registrado na organização."
            }, 201, ct);
        }
    }
}

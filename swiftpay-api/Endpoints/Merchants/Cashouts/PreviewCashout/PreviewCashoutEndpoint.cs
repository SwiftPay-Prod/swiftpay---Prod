using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Cashouts.PreviewCashout;

public sealed class PreviewCashoutEndpoint(
    PrimaryDbContext dbContext,
    IMerchantCalculationService merchantCalculationService
) : Endpoint<PreviewCashoutRequest, PreviewCashoutResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashouts/preview");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(PreviewCashoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new PreviewCashoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new PreviewCashoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var preview = await merchantCalculationService.PreviewCashoutAsync(
            req.MerchantId, req.Amount, req.MerchantAcquirerId, req.ConsolidateAllAcquirers, ct);

        await Send.OkAsync(new PreviewCashoutResponse
        {
            Data = new PreviewCashoutData
            {
                Amount = preview.EffectiveAmount,
                Fee = preview.Fee,
                NetAmount = preview.NetAmount,
                MaxWithdrawableAmount = preview.MaxWithdrawableAmount,
                WithdrawNowAvailable = preview.WithdrawNowAvailable,
                RequiresFullWithdrawalNow = false,
                HasSufficientBalance = preview.HasSufficientBalance,
                IsConsolidated = preview.IsConsolidated,
                OperationCount = preview.OperationCount
            }
        }, ct);
    }
}

using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Interfaces;
using safefy_api.Models.PaymentApi;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Cashouts.CancelCashout;

public sealed class CancelCashoutEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient,
    IApiLogService apiLogService
) : Endpoint<CancelCashoutRequest, CancelCashoutResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/cashouts/{cashoutId:guid}/cancel");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CancelCashoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CancelCashoutResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new CancelCashoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var result = await paymentApiClient.CancelCashoutAsync(new CancelCashoutApiInput
        {
            CashoutId = req.CashoutId,
            MerchantId = req.MerchantId,
            UserId = userId.Value
        }, ct);

        if (!result.Success)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CancelCashout,
                Status = ApiLogStatus.Failed,
                MerchantId = req.MerchantId,
                MerchantName = merchant.Name,
                MerchantDocument = merchant.MerchantKyc?.DocumentNumber,
                HttpMethod = HttpContext.Request.Method,
                Endpoint = HttpContext.Request.Path,
                StatusCode = 400,
                Details = $"Falha ao cancelar saque: {result.ErrorMessage}",
                ResourceId = req.CashoutId,
                ResourceType = ApiLogResourceType.Payout
            });

            await Send.ResponseAsync(new CancelCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao cancelar saque.")
            }, 400, ct);
            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CancelCashout,
            Status = ApiLogStatus.Success,
            MerchantId = req.MerchantId,
            MerchantName = merchant.Name,
            MerchantDocument = merchant.MerchantKyc?.DocumentNumber,
            HttpMethod = HttpContext.Request.Method,
            Endpoint = HttpContext.Request.Path,
            StatusCode = 200,
            Details = $"Saque {req.CashoutId} cancelado para merchant {merchant.Id}",
            ResourceId = result.CashoutId,
            ResourceType = ApiLogResourceType.Payout
        });

        await Send.OkAsync(new CancelCashoutResponse
        {
            Data = new CancelCashoutData
            {
                Id = result.CashoutId!.Value,
                Status = result.Status!.Value
            },
            Message = "Saque cancelado com sucesso."
        }, ct);
    }
}

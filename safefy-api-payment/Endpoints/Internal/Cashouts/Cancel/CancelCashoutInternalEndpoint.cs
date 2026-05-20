using FastEndpoints;
using safefy_api_core.Models.Enum;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Endpoints.Internal.Cashouts.Cancel;

public sealed class CancelCashoutInternalEndpoint(
    ICashoutService cashoutService
) : Endpoint<CancelCashoutInternalRequest, CancelCashoutInternalResponse>
{
    public override void Configure()
    {
        Post("{cashoutId:guid}/cancel");
        Group<InternalCashoutGroup>();
    }

    public override async Task HandleAsync(CancelCashoutInternalRequest req, CancellationToken ct)
    {
        var result = await cashoutService.CancelInternalAsync(req.MerchantId, req.CashoutId, req.UserId, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new CancelCashoutInternalResponse
            {
                Success = false,
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
            return;
        }

        await Send.ResponseAsync(new CancelCashoutInternalResponse
        {
            Success = true,
            CashoutId = result.CashoutId,
            Status = result.Status?.ToString()
        }, 200, ct);
    }
}

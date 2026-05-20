using FastEndpoints;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Documentation;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;

namespace safefy_api_payment.Endpoints.Cashouts.Cancel;

public sealed class CancelCashoutEndpoint(
    ICashoutService cashoutService,
    IApiLogService apiLogService
) : Endpoint<CancelCashoutRequest, CancelCashoutResponse>
{
    public override void Configure()
    {
        Post("{id:guid}/cancel");
        Group<CashoutGroup>();
        Description(d => d
            .Produces<CancelCashoutResponse>(200, "application/json")
            .Produces<CancelCashoutResponse>(400, "application/json")
            .Produces<CancelCashoutResponse>(404, "application/json")
            .Produces<CancelCashoutResponse>(401, "application/json")
            .WithSummary("Cancelar saque")
            .WithDescription(EndpointDescriptions.Cashouts.Cancel));
    }

    public override async Task HandleAsync(CancelCashoutRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new CancelCashoutResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var result = await cashoutService.CancelAsync(merchantId.Value, req.Id, environment.Value, ct);

        if (!result.Success)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CancelCashout,
                Status = ApiLogStatus.Failed,
                ResourceId = req.Id,
                ResourceType = ApiLogResourceType.Payout,
                StatusCode = result.StatusCode,
                Details = result.ErrorMessage
            });

            await Send.ResponseAsync(new CancelCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao cancelar saque.", result.ErrorCode)
            }, result.StatusCode, ct);
            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CancelCashout,
            Status = ApiLogStatus.Success,
            ResourceId = result.CashoutId!.Value,
            ResourceType = ApiLogResourceType.Payout,
            StatusCode = 200
        });

        var response = new CancelCashoutResponse
        {
            Data = new CancelCashoutData
            {
                Id = result.CashoutId!.Value,
                Status = result.Status!.Value
            },
            Message = "Saque cancelado com sucesso."
        };

        await Send.ResponseAsync(response, 200, ct);
    }
}

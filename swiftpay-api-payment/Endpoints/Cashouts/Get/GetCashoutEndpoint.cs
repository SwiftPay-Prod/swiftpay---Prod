using FastEndpoints;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Mappers;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Documentation;

namespace safefy_api_payment.Endpoints.Cashouts.Get;

public sealed class GetCashoutEndpoint(
    ICashoutService cashoutService
) : Endpoint<GetCashoutRequest, GetCashoutResponse>
{
    public override void Configure()
    {
        Get("{id:guid}");
        Group<CashoutGroup>();
        Description(d => d
            .Produces<GetCashoutResponse>(200, "application/json")
            .Produces<GetCashoutResponse>(404, "application/json")
            .Produces<GetCashoutResponse>(401, "application/json")
            .WithSummary("Obter saque")
            .WithDescription(EndpointDescriptions.Cashouts.Get));
    }

    public override async Task HandleAsync(GetCashoutRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new GetCashoutResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var result = await cashoutService.GetByIdAsync(merchantId.Value, req.Id, environment.Value, ct);

        if (!result.Success || result.Payout == null)
        {
            await Send.ResponseAsync(new GetCashoutResponse
            {
                Error = new(result.ErrorMessage ?? "Saque não encontrado.", result.ErrorCode)
            }, result.StatusCode, ct);
            return;
        }

        var response = new GetCashoutResponse
        {
            Data = CashoutMapper.ToGetData(result.Payout, result.PayoutAccount)
        };

        await Send.ResponseAsync(response, 200, ct);
    }
}

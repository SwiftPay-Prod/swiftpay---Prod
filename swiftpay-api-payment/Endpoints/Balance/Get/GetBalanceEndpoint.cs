using FastEndpoints;
using safefy_api_core.Interfaces;
using safefy_api_payment.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.Documentation;
using safefy_api_payment.Mappers;
using safefy_api_core.Services;

namespace safefy_api_payment.Endpoints.Balance.Get;

public sealed class GetBalanceEndpoint(
    ILedgerService ledgerService
) : EndpointWithoutRequest<GetBalanceResponse>
{
    public override void Configure()
    {
        Get("");
        Group<BalanceGroup>();
        Description(d => d
            .Produces<GetBalanceResponse>(200, "application/json")
            .Produces<GetBalanceResponse>(401, "application/json")
            .WithSummary("Consultar saldo")
            .WithDescription(EndpointDescriptions.GetBalanceDescription));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || environment == null)
        {
            await Send.ResponseAsync(new GetBalanceResponse
            {
                Error = new("Credenciais inválidas.")
            }, 401, ct);
            return;
        }

        using var envScope = HybridEnvironmentProvider.SetEnvironment(environment.Value);
        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(merchantId.Value);

        await Send.OkAsync(new GetBalanceResponse
        {
            Data = BalanceMapper.ToData(balanceInfo)
        }, ct);
    }
}

using FastEndpoints;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Merchants.Checkouts.UnpublishCheckout;

public sealed class UnpublishCheckoutEndpoint : Endpoint<UnpublishCheckoutRequest, UnpublishCheckoutResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/checkouts/{checkoutId:guid}/unpublish");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UnpublishCheckoutRequest req, CancellationToken ct)
    {
        await Send.ResponseAsync(new UnpublishCheckoutResponse
        {
            Error = new("Fluxo de desativação removido. Edite o checkout normalmente e conclua a configuração para mantê-lo ativo.")
        }, 400, ct);
    }
}

using FastEndpoints;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Merchants.Checkouts.PublishCheckout;

public sealed class PublishCheckoutEndpoint : Endpoint<PublishCheckoutRequest, PublishCheckoutResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/checkouts/{checkoutId:guid}/publish");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(PublishCheckoutRequest req, CancellationToken ct)
    {
        await Send.ResponseAsync(new PublishCheckoutResponse
        {
            Error = new("Fluxo de publicação removido. O checkout inicia em rascunho e é ativado ao concluir a configuração obrigatória.")
        }, 400, ct);
    }
}

using FastEndpoints;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_payment.EndpointsGroups;

namespace safefy_api_payment.Endpoints.Checkout.CreateOrder;

public sealed class CreateOrderEndpoint(
    CreateOrderHandler handler
) : Endpoint<CreateOrderRequest, CreateOrderResponse>
{
    public override void Configure()
    {
        Post("{shortId}/orders");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(CreateOrderRequest req, CancellationToken ct)
    {
        var requestOrigin = PaymentEndpointUtils.GetRequestOrigin(HttpContext);
        var (response, statusCode) = await handler.HandleAsync(req, requestOrigin, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

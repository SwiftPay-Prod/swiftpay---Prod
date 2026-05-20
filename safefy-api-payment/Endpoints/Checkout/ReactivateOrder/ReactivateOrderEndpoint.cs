using FastEndpoints;
using safefy_api_payment.EndpointsGroups;

namespace safefy_api_payment.Endpoints.Checkout.ReactivateOrder;

public sealed class ReactivateOrderEndpoint(
    ReactivateOrderHandler handler
) : Endpoint<ReactivateOrderRequest, ReactivateOrderResponse>
{
    public override void Configure()
    {
        Post("{shortId}/orders/{orderId:guid}/reactivate");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(ReactivateOrderRequest req, CancellationToken ct)
    {
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

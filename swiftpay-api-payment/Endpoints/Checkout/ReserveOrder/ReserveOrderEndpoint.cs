using FastEndpoints;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.Checkout.ReserveOrder;

public sealed class ReserveOrderEndpoint(
    ReserveOrderHandler handler
) : Endpoint<ReserveOrderRequest, ReserveOrderResponse>
{
    public override void Configure()
    {
        Post("{shortId}/orders/reserve");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(ReserveOrderRequest req, CancellationToken ct)
    {
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

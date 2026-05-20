using FastEndpoints;
using safefy_api_payment.EndpointsGroups;

namespace safefy_api_payment.Endpoints.Checkout.GetOrder;

public sealed class GetOrderEndpoint(GetOrderHandler handler) : Endpoint<GetOrderRequest, GetOrderResponse>
{
    public override void Configure()
    {
        Get("{shortId}/orders/{orderId:guid}");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(GetOrderRequest req, CancellationToken ct)
    {
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

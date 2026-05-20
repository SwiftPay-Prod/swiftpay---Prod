using FastEndpoints;
using safefy_api_payment.EndpointsGroups;

namespace safefy_api_payment.Endpoints.Checkout.UpdateOrder;

public sealed class UpdateOrderEndpoint(UpdateOrderHandler handler) : Endpoint<UpdateOrderRequest, UpdateOrderResponse>
{
    public override void Configure()
    {
        Patch("{shortId}/orders/{orderId}");
        Group<CheckoutGroup>();
        Description(x => x
            .WithTags("Checkout")
            .WithName("UpdateOrder")
            .WithSummary("Atualiza um pedido reservado")
            .WithDescription("Atualiza dados do cliente, endereço e método de pagamento de um pedido em status Reserved.")
            .Produces<UpdateOrderResponse>(200, "application/json")
            .ProducesProblemDetails(404, "application/json")
            .ProducesProblemDetails(400, "application/json"));
    }

    public override async Task HandleAsync(UpdateOrderRequest req, CancellationToken ct)
    {
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

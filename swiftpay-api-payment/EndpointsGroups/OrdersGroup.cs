using FastEndpoints;

namespace swiftpay_api_payment.EndpointsGroups;

/// <summary>
/// Grupo de endpoints de pedidos.
/// Prefixo: /v1/orders
/// </summary>
public sealed class OrdersGroup : Group
{
    public OrdersGroup()
    {
        Configure("/v1/orders", ep =>
        {
            ep.Description(x => x.WithTags("Orders"));
        });
    }
}

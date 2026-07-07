using FastEndpoints;

namespace swiftpay_api_payment.EndpointsGroups;

public class ProductsGroup : Group
{
    public ProductsGroup()
    {
        Configure("v1/products", ep =>
        {
            ep.Description(x => x
                .WithTags("Produtos / Products"));
        });
    }
}

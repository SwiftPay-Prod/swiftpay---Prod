using FastEndpoints;

namespace safefy_api_payment.EndpointsGroups;

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

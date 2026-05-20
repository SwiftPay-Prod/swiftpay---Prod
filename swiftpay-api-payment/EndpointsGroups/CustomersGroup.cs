using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups;

/// <summary>
/// Grupo de endpoints de clientes.
/// </summary>
public class CustomersGroup : Group
{
    public CustomersGroup()
    {
        Configure("v1/customers", ep =>
        {
            ep.PreProcessor<MerchantRateLimitPreProcessor>(Order.Before);
            ep.Description(x => x
                .WithTags("Clientes / Customers"));
        });
    }
}

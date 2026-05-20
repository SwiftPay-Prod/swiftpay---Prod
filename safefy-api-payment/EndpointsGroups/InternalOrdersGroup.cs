using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups;

public class InternalOrdersGroup : Group
{
    public InternalOrdersGroup()
    {
        Configure("v1/internal/orders", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<InternalApiKeyPreProcessor>(Order.Before);
            ep.Description(x => x.ExcludeFromDescription());
        });
    }
}

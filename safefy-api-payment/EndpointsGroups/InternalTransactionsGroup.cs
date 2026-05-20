using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups;

public class InternalTransactionsGroup : Group
{
    public InternalTransactionsGroup()
    {
        Configure("v1/internal/transactions", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<InternalApiKeyPreProcessor>(Order.Before);
            ep.Description(x => x.ExcludeFromDescription());
        });
    }
}

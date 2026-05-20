using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups;

public class InternalCashoutGroup : Group
{
    public InternalCashoutGroup()
    {
        Configure("v1/internal/cashouts", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<InternalApiKeyPreProcessor>(Order.Before);
            ep.Description(x => x.ExcludeFromDescription());
        });
    }
}

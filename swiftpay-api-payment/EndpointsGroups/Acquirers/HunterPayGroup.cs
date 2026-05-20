using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups.Acquirers;

public class HunterPayGroup : Group
{
    public HunterPayGroup()
    {
        Configure("v1/internal/hunterpay", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<AcquirerWebhookAuthPreProcessor>(Order.Before);
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

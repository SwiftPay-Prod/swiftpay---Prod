using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups.Acquirers;

public class PluggouGroup : Group
{
    public PluggouGroup()
    {
        Configure("v1/internal/pluggou", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<AcquirerWebhookAuthPreProcessor>(Order.Before);
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups.Acquirers;

public class ActivePaymentsGroup : Group
{
    public ActivePaymentsGroup()
    {
        Configure("v1/internal/activepayments", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<AcquirerWebhookAuthPreProcessor>(Order.Before);
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

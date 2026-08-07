using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups.Acquirers;

public class FlevoPayGroup : Group
{
    public FlevoPayGroup()
    {
        Configure("v1/internal/flevopay", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<AcquirerWebhookAuthPreProcessor>(Order.Before);
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}
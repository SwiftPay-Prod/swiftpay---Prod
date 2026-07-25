using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups.Acquirers;

public class MagicPayGroup : Group
{
    public MagicPayGroup()
    {
        Configure("v1/internal/magicpay", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<AcquirerWebhookAuthPreProcessor>(Order.Before);
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

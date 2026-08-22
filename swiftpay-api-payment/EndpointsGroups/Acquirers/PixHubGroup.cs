using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups.Acquirers;

public class PixHubGroup : Group
{
    public PixHubGroup()
    {
        Configure("v1/internal/pixhub", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<AcquirerWebhookAuthPreProcessor>(Order.Before);
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

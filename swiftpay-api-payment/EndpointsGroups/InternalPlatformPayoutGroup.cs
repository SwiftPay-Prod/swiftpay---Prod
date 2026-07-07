using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups;

public class InternalPlatformPayoutGroup : Group
{
    public InternalPlatformPayoutGroup()
    {
        Configure("v1/internal/platform-payouts", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<InternalApiKeyPreProcessor>(Order.Before);
            ep.Description(x => x.ExcludeFromDescription());
        });
    }
}

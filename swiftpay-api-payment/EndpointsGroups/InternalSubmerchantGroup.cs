using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups;

public class InternalSubmerchantGroup : Group
{
    public InternalSubmerchantGroup()
    {
        Configure("v1/internal/submerchants", ep =>
        {
            ep.AllowAnonymous();
            ep.PreProcessor<InternalApiKeyPreProcessor>(Order.Before);
            ep.Description(x => x.ExcludeFromDescription());
        });
    }
}

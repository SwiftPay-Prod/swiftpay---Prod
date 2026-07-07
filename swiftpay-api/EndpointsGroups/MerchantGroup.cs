using FastEndpoints;

namespace swiftpay_api.EndpointsGroups;

public class MerchantGroup : Group
{
    public MerchantGroup()
    {
        Configure("v1/merchant", ep =>
        {
            ep.Description(x => x.WithTags("Merchant"));
        });
    }
}

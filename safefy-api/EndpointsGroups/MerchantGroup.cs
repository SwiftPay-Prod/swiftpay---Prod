using FastEndpoints;

namespace safefy_api.EndpointsGroups;

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

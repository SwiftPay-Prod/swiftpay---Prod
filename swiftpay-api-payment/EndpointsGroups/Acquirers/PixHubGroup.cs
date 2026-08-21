using FastEndpoints;

namespace swiftpay_api_payment.EndpointsGroups.Acquirers;

public class PixHubGroup : Group
{
    public PixHubGroup()
    {
        Configure("v1/internal/pixhub", ep =>
        {
            ep.AllowAnonymous();
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

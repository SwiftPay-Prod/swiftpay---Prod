using FastEndpoints;

namespace swiftpay_api_payment.EndpointsGroups.Acquirers;

public class FlevoPayGroup : Group
{
    public FlevoPayGroup()
    {
        Configure("v1/internal/flevopay", ep =>
        {
            ep.AllowAnonymous();
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}
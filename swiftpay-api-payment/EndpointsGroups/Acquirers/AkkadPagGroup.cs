using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups.Acquirers;

public class AkkadPagGroup : Group
{
    public AkkadPagGroup()
    {
        Configure("v1/internal/akkadpag", ep =>
        {
            ep.AllowAnonymous();
            ep.Description(d => d.ExcludeFromDescription());
        });
    }
}

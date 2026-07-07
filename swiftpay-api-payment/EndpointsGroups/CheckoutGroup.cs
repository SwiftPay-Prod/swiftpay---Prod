using FastEndpoints;
using swiftpay_api_payment.Extensions;

namespace swiftpay_api_payment.EndpointsGroups;

public class CheckoutGroup : Group
{
    public CheckoutGroup()
    {
        Configure("v1/checkouts", ep =>
        {
            ep.AllowAnonymous();
            ep.Options(o => o.RequireCors(CorsExtensions.CheckoutCorsPolicy));
            ep.Description(x => x
                .WithTags("Checkout"));
        });
    }
}

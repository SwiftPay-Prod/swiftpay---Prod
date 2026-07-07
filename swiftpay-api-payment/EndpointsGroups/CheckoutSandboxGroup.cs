using FastEndpoints;
using swiftpay_api_payment.Extensions;

namespace swiftpay_api_payment.EndpointsGroups;

public class CheckoutSandboxGroup : Group
{
    public CheckoutSandboxGroup()
    {
        Configure("v1/checkouts/sandbox", ep =>
        {
            ep.AllowAnonymous();
            ep.Options(o => o.RequireCors(CorsExtensions.CheckoutCorsPolicy));
            ep.Description(x => x
                .WithTags("Checkout"));
        });
    }
}

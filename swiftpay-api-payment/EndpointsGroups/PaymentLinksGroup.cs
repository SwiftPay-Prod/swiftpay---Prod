using FastEndpoints;

namespace safefy_api_payment.EndpointsGroups;

public class PaymentLinksGroup : Group
{
    public PaymentLinksGroup()
    {
        Configure("v1/payment-links", ep =>
        {
            ep.AllowAnonymous();
            ep.Description(x => x
                .WithTags("Payment Links"));
        });
    }
}

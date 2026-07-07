using FastEndpoints;
using swiftpay_api_payment.Filters;

namespace swiftpay_api_payment.EndpointsGroups;

public class CashoutGroup : Group
{
    public CashoutGroup()
    {
        Configure("v1/cashouts", ep =>
        {
            ep.PreProcessor<MerchantRateLimitPreProcessor>(Order.Before);
            ep.Description(x => x
                .WithTags("Saques / Cashouts"));
        });
    }
}

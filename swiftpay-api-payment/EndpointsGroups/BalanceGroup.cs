using FastEndpoints;

namespace swiftpay_api_payment.EndpointsGroups;

/// <summary>
/// Grupo de endpoints de Saldo.
/// </summary>
public class BalanceGroup : Group
{
    public BalanceGroup()
    {
        Configure("v1/balance", ep =>
        {
            ep.Description(x => x
                .WithTags("Saldo / Balance"));
        });
    }
}

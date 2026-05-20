using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups;

/// <summary>
/// Grupo de endpoints de Transações.
/// Unifica todos os métodos de pagamento (PIX, Cartão, Boleto).
/// </summary>
public class TransactionsGroup : Group
{
    public TransactionsGroup()
    {
        Configure("v1/transactions", ep =>
        {
            ep.PreProcessor<MerchantRateLimitPreProcessor>(Order.Before);
            ep.Description(x => x
                .WithTags("Transações / Transactions"));
        });
    }
}

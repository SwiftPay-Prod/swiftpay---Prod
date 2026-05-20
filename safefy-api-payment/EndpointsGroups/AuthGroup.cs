using FastEndpoints;
using safefy_api_payment.Filters;

namespace safefy_api_payment.EndpointsGroups;

/// <summary>
/// Grupo de endpoints de autenticação.
/// </summary>
public class AuthGroup : Group
{
    public AuthGroup()
    {
        Configure("v1/auth", ep =>
        {
            ep.PreProcessor<IpRateLimitPreProcessor>(Order.Before);
            ep.Description(x => x
                .WithTags("Autenticação / Authentication"));
        });
    }
}

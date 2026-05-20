using safefy_api_core.Extensions;

namespace safefy_api_payment.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddSafefyAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddJwtAuthentication(configuration);
    }
}

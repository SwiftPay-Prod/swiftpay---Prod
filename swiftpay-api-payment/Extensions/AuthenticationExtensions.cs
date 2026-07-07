using swiftpay_api_core.Extensions;

namespace swiftpay_api_payment.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddSwiftPayAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddJwtAuthentication(configuration);
    }
}

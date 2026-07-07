using swiftpay_api_core.Extensions;

namespace swiftpay_api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddSafefyAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddJwtAuthentication(configuration, events =>
        {
            events.OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            };
        });
    }
}

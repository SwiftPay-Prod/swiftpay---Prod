using Microsoft.AspNetCore.Authentication.JwtBearer;
using swiftpay_api_core.Extensions;
namespace swiftpay_api.Extensions;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddSwiftPayAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddJwtAuthentication(configuration, events =>
        {
            events.OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"].ToString();
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                    Console.WriteLine($"[JWT OnMessageReceived] Path={path}, tokenLen={accessToken.Length}");
                }
                return Task.CompletedTask;
            };
            events.OnTokenValidated = context =>
            {
                Console.WriteLine($"[JWT OnTokenValidated] User={context.Principal?.Identity?.Name}, IsAuth={context.Principal?.Identity?.IsAuthenticated}");
                return Task.CompletedTask;
            };
            events.OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"[JWT OnAuthenticationFailed] {context.Exception?.GetType().Name}: {context.Exception?.Message}");
                return Task.CompletedTask;
            };
            events.OnChallenge = context =>
            {
                Console.WriteLine($"[JWT OnChallenge] Error={context.Error}, ErrorDesc={context.ErrorDescription}");
                return Task.CompletedTask;
            };
        });
    }
}

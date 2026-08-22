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
                }
                return Task.CompletedTask;
            };
            events.OnAuthenticationFailed = context =>
            {
                var logger = context.HttpContext.RequestServices.GetService<ILogger<JwtBearerEvents>>();
                logger?.LogWarning(context.Exception, "SignalR / JWT authentication failed on {Path}", context.HttpContext.Request.Path);
                return Task.CompletedTask;
            };
        });
    }
}

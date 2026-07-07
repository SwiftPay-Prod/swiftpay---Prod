using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_payment.Extensions;

public static class CorsExtensions
{
    public const string CheckoutCorsPolicy = "CheckoutCorsPolicy";

    public static IServiceCollection AddSwiftPayCors(this IServiceCollection services, IConfiguration configuration)
    {
        var platformSettings = configuration.GetSection(PlatformSettingsOptions.PlatformSettings).Get<PlatformSettingsOptions>();
        var checkoutOrigin = (platformSettings?.CheckoutBaseUrl ?? "http://localhost:3000").TrimEnd('/');

        services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });

            options.AddPolicy(CheckoutCorsPolicy, policy =>
            {
                policy.SetIsOriginAllowed(origin =>
                        Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                        && (
                            origin.TrimEnd('/').Equals(checkoutOrigin, StringComparison.OrdinalIgnoreCase)
                            || (uri.Scheme == Uri.UriSchemeHttps
                                && (uri.Host.Equals("swiftpay.com.br", StringComparison.OrdinalIgnoreCase)
                                    || uri.Host.EndsWith(".swiftpay.com.br", StringComparison.OrdinalIgnoreCase)))
                        ))
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}

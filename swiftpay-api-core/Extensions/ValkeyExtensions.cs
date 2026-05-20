using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;
using safefy_api_core.Models.Settings;

namespace safefy_api_core.Extensions;

public static class ValkeyExtensions
{
    public static IServiceCollection AddValkeyCache(this IServiceCollection services, IConfiguration configuration)
    {
        var valkeySettings = configuration.GetSection(ValkeySettings.SectionName).Get<ValkeySettings>();

        if (valkeySettings == null || string.IsNullOrEmpty(valkeySettings.ConnectionString))
        {
            throw new InvalidOperationException("Valkey connection string is not configured. Please set ValkeySettings:ConnectionString in appsettings.json");
        }

        services.AddStackExchangeRedisCache(options =>
        {
            var configurationOptions = ConfigurationOptions.Parse(valkeySettings.ConnectionString);
            configurationOptions.CertificateValidation += (_, _, _, _) => true;

            options.ConfigurationOptions = configurationOptions;
            options.InstanceName = valkeySettings.InstanceName;
        });

        return services;
    }
}

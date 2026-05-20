using safefy_api.Models.Settings;
using safefy_api_core.Extensions;

namespace safefy_api.Extensions;

public static class SettingsExtensions
{
    public static IServiceCollection AddAllSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCoreSettings(configuration);

        services.Configure<StorageSettingsOptions>(
            configuration.GetSection(StorageSettingsOptions.StorageSettings));

        services.Configure<PaymentApiSettings>(
            configuration.GetSection(PaymentApiSettings.PaymentApi));

        return services;
    }
}

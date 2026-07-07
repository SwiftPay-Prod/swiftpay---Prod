using swiftpay_api.Models.Settings;
using swiftpay_api_core.Extensions;

namespace swiftpay_api.Extensions;

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

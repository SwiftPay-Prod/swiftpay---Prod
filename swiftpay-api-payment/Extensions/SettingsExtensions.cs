using swiftpay_api_payment.Models.Settings;
using swiftpay_api_core.Extensions;

namespace swiftpay_api_payment.Extensions;

public static class SettingsExtensions
{
    public static IServiceCollection AddAllSettings(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCoreSettings(configuration);

        services.Configure<BankiziSettingsOptions>(
            configuration.GetSection(BankiziSettingsOptions.BankiziSettings));

        return services;
    }
}

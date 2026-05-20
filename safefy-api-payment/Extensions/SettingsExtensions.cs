using safefy_api_payment.Models.Settings;
using safefy_api_core.Extensions;

namespace safefy_api_payment.Extensions;

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

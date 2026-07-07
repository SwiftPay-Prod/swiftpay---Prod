using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;
using swiftpay_api_core.Database;

namespace swiftpay_api_core.Extensions;

public static class DataProtectionExtensions
{
    public static IServiceCollection AddSafefyDataProtection(this IServiceCollection services)
    {
        services.AddDataProtection()
            .PersistKeysToDbContext<PrimaryDbContext>()
            .SetApplicationName("Safefy");

        return services;
    }
}

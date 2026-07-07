using swiftpay_api_core.Extensions;

namespace swiftpay_api.Extensions;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabases(this IServiceCollection services)
    {
        services.AddPrimaryDbContext(migrationsAssembly: "swiftpay-api");

        services.AddLogDbContext(migrationsAssembly: "swiftpay-api");

        return services;
    }

    public static IServiceCollection AddHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddDatabaseHealthChecks(configuration);
    }

    public static IServiceCollection AddValkey(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddValkeyCache(configuration);
    }
}

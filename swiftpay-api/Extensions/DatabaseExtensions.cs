using safefy_api_core.Extensions;

namespace safefy_api.Extensions;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabases(this IServiceCollection services)
    {
        services.AddPrimaryDbContext(migrationsAssembly: "safefy-api");

        services.AddLogDbContext(migrationsAssembly: "safefy-api");

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

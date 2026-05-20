using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using safefy_api_core.Models.Settings;

namespace safefy_api_core.Extensions;

public static class HealthCheckExtensions
{
    public static IServiceCollection AddDatabaseHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var databaseSettings = configuration.GetSection(DatabaseSettingsOptions.DatabaseSettings).Get<DatabaseSettingsOptions>()
            ?? throw new InvalidOperationException("DatabaseSettings configuration is required");

        services.AddHealthChecks()
            .AddNpgSql(databaseSettings.ConnectionString, name: "postgresql", tags: ["db", "critical"]);

        return services;
    }
}

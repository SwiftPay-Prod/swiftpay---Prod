using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using safefy_api_core.Database;
using safefy_api_core.Models.Settings;

namespace safefy_api.Database;

public sealed class LogDbContextDesignTimeFactory : IDesignTimeDbContextFactory<LogDbContext>
{
    public LogDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration
            .GetSection(LogsDatabaseSettingsOptions.LogsDatabaseSettings)
            .GetValue<string>("ConnectionString");

        var optionsBuilder = new DbContextOptionsBuilder<LogDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
            npgsqlOptions.MigrationsAssembly("safefy-api"));

        return new LogDbContext(optionsBuilder.Options);
    }
}

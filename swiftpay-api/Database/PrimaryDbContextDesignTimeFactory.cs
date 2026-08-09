using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Database;

public sealed class PrimaryDbContextDesignTimeFactory : IDesignTimeDbContextFactory<PrimaryDbContext>
{
    public PrimaryDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration
            .GetSection(DatabaseSettingsOptions.DatabaseSettings)
            .GetValue<string>("ConnectionString");

        var optionsBuilder = new DbContextOptionsBuilder<PrimaryDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsqlOptions =>
            npgsqlOptions.MigrationsAssembly("swiftpay-api"));

        return new PrimaryDbContext(optionsBuilder.Options);
    }
}
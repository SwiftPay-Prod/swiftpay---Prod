using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Extensions;

namespace safefy_api_payment.Extensions;

public static class DatabaseExtensions
{
    public static IServiceCollection AddDatabases(this IServiceCollection services)
    {
        services.AddPrimaryDbContext();

        services.AddLogDbContext();

        return services;
    }

    public static IServiceCollection AddHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        return services.AddDatabaseHealthChecks(configuration);
    }

    public static async Task EnsureDatabaseConnectionAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

        var maxRetries = 30;
        for (var i = 0; i < maxRetries; i++)
        {
            try
            {
                if (db.Database.CanConnect() && db.Merchants.Any(m => false))
                {
                    break;
                }
                break;
            }
            catch
            {
                if (i == maxRetries - 1) throw;
                Console.WriteLine($"Aguardando banco de dados... ({i + 1}/{maxRetries})");
                await Task.Delay(1000);
            }
        }

        var logDb = scope.ServiceProvider.GetRequiredService<LogDbContext>();
        if (!await logDb.Database.CanConnectAsync())
        {
            throw new InvalidOperationException("Log database connection failed.");
        }
    }
}

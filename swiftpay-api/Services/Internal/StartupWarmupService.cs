using Microsoft.EntityFrameworkCore;
using swiftpay_api.Database;
using swiftpay_api_core.Database;
using swiftpay_api_core.Extensions;

namespace swiftpay_api.Services.Internal;

public sealed class StartupWarmupService(
    IServiceProvider serviceProvider,
    ILogger<StartupWarmupService> logger
) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        const int maxRetries = 30;

        for (var attempt = 1; attempt <= maxRetries && !stoppingToken.IsCancellationRequested; attempt++)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();

                var primaryDb = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
                await primaryDb.Database.MigrateAsync(stoppingToken);
                PrimaryDbInitialize.Initialize(primaryDb);

                var logDbFactory = scope.ServiceProvider.GetRequiredService<IDbContextFactory<LogDbContext>>();
                await using var logDb = await logDbFactory.CreateDbContextAsync(stoppingToken);
                await logDb.Database.MigrateAsync(stoppingToken);

                return;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Startup warmup failed on attempt {Attempt} of {MaxRetries}", attempt, maxRetries);

                if (attempt == maxRetries)
                {
                    return;
                }

                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
        }
    }
}

using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;

namespace safefy_api_payment.Services.Internal;

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
                if (!await primaryDb.Database.CanConnectAsync(stoppingToken))
                {
                    throw new InvalidOperationException("Primary database connection failed.");
                }

                var logDb = scope.ServiceProvider.GetRequiredService<LogDbContext>();
                if (!await logDb.Database.CanConnectAsync(stoppingToken))
                {
                    throw new InvalidOperationException("Log database connection failed.");
                }

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

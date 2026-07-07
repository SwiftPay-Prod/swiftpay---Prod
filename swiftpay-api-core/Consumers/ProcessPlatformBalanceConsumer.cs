using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Services;

namespace swiftpay_api_core.Consumers;

public sealed class ProcessPlatformBalanceConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessPlatformBalanceConsumer> logger
) : IConsumer<ProcessPlatformBalanceMessage>
{
    private const int CacheDurationMinutes = 5;

    public async Task Consume(ConsumeContext<ProcessPlatformBalanceMessage> context)
    {
        var acquirerId = context.Message.AcquirerId;
        var environment = context.Message.Environment;

        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(environment);
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var calculationService = scope.ServiceProvider.GetRequiredService<ICalculationService>();
        var dashboardHubService = scope.ServiceProvider.GetService<IDashboardHubService>();

        try
        {
            var now = DateTime.UtcNow;

            var cache = await dbContext.PlatformBalanceCaches
                .FirstOrDefaultAsync(c => c.AcquirerId == acquirerId && c.Environment == environment);

            if (cache == null)
            {
                cache = new PlatformBalanceCache
                {
                    Id = Guid.CreateVersion7(),
                    AcquirerId = acquirerId,
                    Environment = environment,
                    CreatedAt = now
                };
                dbContext.PlatformBalanceCaches.Add(cache);
            }

            if (cache.NextProcessAt.HasValue && now < cache.NextProcessAt.Value && !cache.IsProcessing)
            {
                return;
            }

            cache.IsProcessing = true;
            await dbContext.SaveChangesAsync();

            var balanceSnapshot = (await calculationService.GetCurrentAcquirerBalanceSnapshotsAsync([acquirerId], environment))
                .GetValueOrDefault(acquirerId);

            var acquirerSettlement = balanceSnapshot?.SettlementBalance ?? 0;
            var acquirerPayoutsOut = balanceSnapshot?.PayoutsOutBalance ?? 0;
            var merchantTotalAvailable = balanceSnapshot?.MerchantAvailableBalance ?? 0;
            var merchantTotalBlocked = Math.Max(0, (balanceSnapshot?.MerchantBalance ?? 0) - merchantTotalAvailable);
            var platformProfit = calculationService.CalculatePlatformProfit(
                balanceSnapshot?.GrossBalance ?? 0,
                balanceSnapshot?.MerchantBalance ?? 0);

            cache.AcquirerSettlement = acquirerSettlement;
            cache.AcquirerPayoutsOut = acquirerPayoutsOut;
            cache.MerchantTotalAvailable = merchantTotalAvailable;
            cache.MerchantTotalBlocked = merchantTotalBlocked;
            cache.PlatformProfit = platformProfit;
            cache.CalculatedAt = now;
            cache.ExpiresAt = now.AddMinutes(CacheDurationMinutes);
            cache.IsProcessing = false;
            cache.NextProcessAt = now.AddMinutes(CacheDurationMinutes);
            cache.UpdatedAt = now;

            await dbContext.SaveChangesAsync();

            if (dashboardHubService != null)
            {
                await dashboardHubService.NotifyAdminDashboardUpdatedAsync(environment);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process platform balance for AcquirerId={AcquirerId}, Environment={Environment}", acquirerId, environment);

            var cacheToReset = await dbContext.PlatformBalanceCaches
                .FirstOrDefaultAsync(c => c.AcquirerId == acquirerId && c.Environment == environment);

            if (cacheToReset != null)
            {
                cacheToReset.IsProcessing = false;
                await dbContext.SaveChangesAsync();
            }

            throw;
        }
    }
}

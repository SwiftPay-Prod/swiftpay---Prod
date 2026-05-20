using System.Text.Json;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Dashboard;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Services;
using safefy_api_core.Utils;

namespace safefy_api_core.Consumers;

public sealed class ProcessMerchantDashboardConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessMerchantDashboardConsumer> logger
) : IConsumer<ProcessMerchantDashboardMessage>
{
    private const int CacheDurationMinutes = 5;

    public async Task Consume(ConsumeContext<ProcessMerchantDashboardMessage> context)
    {
        var message = context.Message;

        // Setar o environment ANTES de criar o scope para que o DbContext use o QueryFilter correto
        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var dashboardHubService = scope.ServiceProvider.GetService<IDashboardHubService>();

        try
        {
            var now = DateTime.UtcNow;

            // QueryFilter por environment é aplicado automaticamente
            var cache = await dbContext.MerchantDashboardCaches
                .Where(c => c.MerchantId == message.MerchantId)
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync();

            if (cache == null)
            {
                logger.LogError("Cache not found for merchant {MerchantId} ({Environment}). Skipping.",
                    message.MerchantId, message.Environment);
                return;
            }

            if (cache.NextProcessAt.HasValue && now < cache.NextProcessAt.Value && !cache.IsProcessing)
            {
                return;
            }

            var newData = await CalculateDashboardData(dbContext, message.MerchantId, message.Environment, now);

            UpdateCacheFromData(cache, newData, now);
            await dbContext.SaveChangesAsync();

            if (dashboardHubService != null)
            {
                await dashboardHubService.NotifyMerchantDashboardUpdatedAsync(message.MerchantId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process merchant dashboard for {MerchantId} ({Environment})",
                message.MerchantId, message.Environment);

            // QueryFilter por environment é aplicado automaticamente
            var cacheToReset = await dbContext.MerchantDashboardCaches
                .Where(c => c.MerchantId == message.MerchantId)
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync();

            if (cacheToReset != null)
            {
                cacheToReset.IsProcessing = false;
                await dbContext.SaveChangesAsync();
            }

            throw;
        }
    }

    private static void UpdateCacheFromData(MerchantDashboardCache cache, MerchantDashboardCache newData, DateTime now)
    {
        cache.TotalVolume = newData.TotalVolume;
        cache.TotalFees = newData.TotalFees;
        cache.TotalPayouts = newData.TotalPayouts;
        cache.ApprovalRate = newData.ApprovalRate;
        cache.ChargebackCount = newData.ChargebackCount;
        cache.ChargebackRate = newData.ChargebackRate;
        cache.FailedTransactions = newData.FailedTransactions;
        cache.FailedRate = newData.FailedRate;
        cache.TotalTransactions = newData.TotalTransactions;
        cache.CompletedTransactions = newData.CompletedTransactions;
        cache.VolumeToday = newData.VolumeToday;
        cache.VolumeThisWeek = newData.VolumeThisWeek;
        cache.VolumeThisMonth = newData.VolumeThisMonth;
        cache.VolumeGrowth = newData.VolumeGrowth;
        cache.TransactionsGrowth = newData.TransactionsGrowth;
        cache.ApprovalRateGrowth = newData.ApprovalRateGrowth;
        cache.FailedRateGrowth = newData.FailedRateGrowth;
        cache.VolumeChartJson = newData.VolumeChartJson;
        cache.WeeklyChartJson = newData.WeeklyChartJson;
        cache.CalculatedAt = now;
        cache.ExpiresAt = now.AddMinutes(CacheDurationMinutes);
        cache.IsProcessing = false;
        cache.NextProcessAt = now.AddMinutes(CacheDurationMinutes);
    }

    private static async Task<MerchantDashboardCache> CalculateDashboardData(
        PrimaryDbContext dbContext,
        Guid merchantId,
        ApiEnvironment environment,
        DateTime now)
    {
        var sevenDaysAgoUtc = DateTimeUtils.GetDaysAgoUtc(7);
        var twentyEightDaysAgoUtc = DateTimeUtils.GetDaysAgoUtc(28);
        var todayUtc = DateTimeUtils.GetTodayStartUtc();
        var startOfWeekUtc = DateTimeUtils.GetWeekStartUtc();
        var startOfLastWeekUtc = startOfWeekUtc.AddDays(-7);
        var startOfMonthUtc = DateTimeUtils.GetMonthStartUtc();
        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDateTime();

        // Stats filtrados por período (últimos 7 dias - período padrão do cache)
        // QueryFilter por environment é aplicado automaticamente
        var statsQuery = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.CreatedAt >= sevenDaysAgoUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed),
                ChargebackCount = g.Count(p => p.Status == PaymentStatus.Disputed),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                TotalFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.PlatformFee)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var totalTransactions = statsQuery?.TotalTransactions ?? 0;
        var completedTransactions = statsQuery?.CompletedTransactions ?? 0;
        var failedTransactions = statsQuery?.FailedTransactions ?? 0;
        var chargebackCount = statsQuery?.ChargebackCount ?? 0;
        var totalVolume = statsQuery?.TotalVolume ?? 0;
        var totalFees = statsQuery?.TotalFees ?? 0;

        var approvalRate = MathUtils.CalculatePercentage(completedTransactions, totalTransactions);
        var chargebackRate = MathUtils.CalculatePercentage(chargebackCount, totalTransactions);
        var failedRate = MathUtils.CalculatePercentage(failedTransactions, totalTransactions);

        var totalPayouts = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId 
                     && p.Status == PayoutStatus.Completed 
                     && p.CompletedAt >= sevenDaysAgoUtc)
            .SumAsync(p => p.Amount);

        // QueryFilter por environment é aplicado automaticamente
        var periodStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                VolumeToday = g.Where(p => p.CompletedAt >= todayUtc).Sum(p => p.Amount),
                VolumeThisWeek = g.Where(p => p.CompletedAt >= startOfWeekUtc).Sum(p => p.Amount),
                VolumeThisMonth = g.Where(p => p.CompletedAt >= startOfMonthUtc).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        // Calculate week-over-week growth rates
        var thisWeekStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.CreatedAt >= startOfWeekUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var lastWeekStats = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.CreatedAt >= startOfLastWeekUtc
                     && p.CreatedAt < startOfWeekUtc)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var (volumeGrowth, transactionsGrowth, approvalRateGrowth, failedRateGrowth) = 
            CalculateGrowthRates(thisWeekStats, lastWeekStats);

        // QueryFilter por environment é aplicado automaticamente
        var chartData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed
                     && p.CompletedAt >= sevenDaysAgoUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                Volume = g.Sum(p => p.Amount),
                TransactionCount = g.Count()
            })
            .ToListAsync();

        var volumeChart = Enumerable.Range(0, 7)
            .Select(i => brasiliaToday.AddDays(-6 + i))
            .Select(date =>
            {
                var dayData = chartData.FirstOrDefault(c => DateTimeUtils.ToBrasiliaTime(c.Date).Date == date);
                return new MerchantDailyVolumeData
                {
                    Date = DateOnly.FromDateTime(date),
                    Volume = dayData?.Volume ?? 0,
                    TransactionCount = dayData?.TransactionCount ?? 0
                };
            })
            .ToList();

        // QueryFilter por environment é aplicado automaticamente
        var weeklyChartData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.MerchantId == merchantId
                     && !p.SuppressMerchantVisibility
                     && !p.IsWayneProtocol
                     && p.Status == PaymentStatus.Completed
                     && p.CompletedAt >= twentyEightDaysAgoUtc)
            .ToListAsync();

        var weeklyChart = new List<MerchantWeeklyVolumeData>();
        for (int i = 3; i >= 0; i--)
        {
            var weekEnd = brasiliaToday.AddDays(-i * 7);
            var weekStart = weekEnd.AddDays(-6);

            var weekPayments = weeklyChartData
                .Where(p => p.CompletedAt.HasValue && 
                            DateTimeUtils.ToBrasiliaTime(p.CompletedAt.Value).Date >= weekStart && 
                            DateTimeUtils.ToBrasiliaTime(p.CompletedAt.Value).Date <= weekEnd)
                .ToList();

            var label = i switch
            {
                0 => "Esta semana",
                1 => "Semana passada",
                _ => $"{i + 1} sem. atrás"
            };

            weeklyChart.Add(new MerchantWeeklyVolumeData
            {
                WeekNumber = 4 - i,
                Label = label,
                Volume = weekPayments.Sum(p => p.Amount),
                TransactionCount = weekPayments.Count
            });
        }

        return new MerchantDashboardCache
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Environment = environment,
            TotalVolume = totalVolume,
            TotalFees = totalFees,
            TotalPayouts = totalPayouts,
            ApprovalRate = approvalRate,
            ChargebackCount = chargebackCount,
            ChargebackRate = chargebackRate,
            FailedTransactions = failedTransactions,
            FailedRate = failedRate,
            TotalTransactions = totalTransactions,
            CompletedTransactions = completedTransactions,
            VolumeToday = periodStats?.VolumeToday ?? 0,
            VolumeThisWeek = periodStats?.VolumeThisWeek ?? 0,
            VolumeThisMonth = periodStats?.VolumeThisMonth ?? 0,
            VolumeGrowth = volumeGrowth,
            TransactionsGrowth = transactionsGrowth,
            ApprovalRateGrowth = approvalRateGrowth,
            FailedRateGrowth = failedRateGrowth,
            VolumeChartJson = JsonSerializer.Serialize(volumeChart),
            WeeklyChartJson = JsonSerializer.Serialize(weeklyChart),
            CalculatedAt = now,
            ExpiresAt = now.AddMinutes(CacheDurationMinutes)
        };
    }

    private static (decimal? volumeGrowth, decimal? transactionsGrowth, decimal? approvalRateGrowth, decimal? failedRateGrowth) 
        CalculateGrowthRates(dynamic? thisWeekStats, dynamic? lastWeekStats)
    {
        decimal? volumeGrowth = null;
        decimal? transactionsGrowth = null;
        decimal? approvalRateGrowth = null;
        decimal? failedRateGrowth = null;

        var thisWeekVolume = (long)(thisWeekStats?.TotalVolume ?? 0);
        var lastWeekVolume = (long)(lastWeekStats?.TotalVolume ?? 0);
        var thisWeekTransactions = (int)(thisWeekStats?.TotalTransactions ?? 0);
        var lastWeekTransactions = (int)(lastWeekStats?.TotalTransactions ?? 0);

        if (lastWeekVolume > 0)
        {
            volumeGrowth = Math.Round(((decimal)(thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100, 1);
        }
        else if (thisWeekVolume > 0)
        {
            volumeGrowth = 100;
        }

        if (lastWeekTransactions > 0)
        {
            transactionsGrowth = Math.Round(((decimal)(thisWeekTransactions - lastWeekTransactions) / lastWeekTransactions) * 100, 1);
        }
        else if (thisWeekTransactions > 0)
        {
            transactionsGrowth = 100;
        }

        var thisWeekCompleted = (int)(thisWeekStats?.CompletedTransactions ?? 0);
        var lastWeekCompleted = (int)(lastWeekStats?.CompletedTransactions ?? 0);
        var thisWeekApproval = thisWeekTransactions > 0 
            ? MathUtils.CalculatePercentage(thisWeekCompleted, thisWeekTransactions) 
            : 0;
        var lastWeekApproval = lastWeekTransactions > 0 
            ? MathUtils.CalculatePercentage(lastWeekCompleted, lastWeekTransactions) 
            : 0;

        if (lastWeekTransactions > 0)
        {
            approvalRateGrowth = Math.Round(thisWeekApproval - lastWeekApproval, 1);
        }

        var thisWeekFailed = (int)(thisWeekStats?.FailedTransactions ?? 0);
        var lastWeekFailed = (int)(lastWeekStats?.FailedTransactions ?? 0);
        var thisWeekFailedRate = thisWeekTransactions > 0 
            ? MathUtils.CalculatePercentage(thisWeekFailed, thisWeekTransactions) 
            : 0;
        var lastWeekFailedRate = lastWeekTransactions > 0 
            ? MathUtils.CalculatePercentage(lastWeekFailed, lastWeekTransactions) 
            : 0;

        if (lastWeekTransactions > 0)
        {
            failedRateGrowth = Math.Round(thisWeekFailedRate - lastWeekFailedRate, 1);
        }

        return (volumeGrowth, transactionsGrowth, approvalRateGrowth, failedRateGrowth);
    }
}

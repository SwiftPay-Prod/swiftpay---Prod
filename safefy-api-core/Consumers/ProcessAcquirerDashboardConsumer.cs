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
using safefy_api_core.Utils;

namespace safefy_api_core.Consumers;

public sealed class ProcessAcquirerDashboardConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessAcquirerDashboardConsumer> logger
) : IConsumer<ProcessAcquirerDashboardMessage>
{
    private const int CacheDurationMinutes = 15;

    private sealed record PeriodFilterInfo(
        string Key,
        DateTime PeriodStart,
        DateTime? PeriodEndExclusive,
        int PeriodDays,
        string GrowthLabel,
        DateOnly ChartStartDate,
        DateOnly ChartEndDate,
        bool IsAll
    );

    private static PeriodFilterInfo ResolvePeriodFilter(string period, DateTime now)
    {
        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDate();

        if (TryParseCustomPeriod(period, out var customStartDate, out var customEndDate))
        {
            var start = DateTime.SpecifyKind(customStartDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            var endExclusive = DateTime.SpecifyKind(customEndDate.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
            var days = Math.Max(1, customEndDate.DayNumber - customStartDate.DayNumber + 1);

            return new PeriodFilterInfo(
                period,
                start,
                endExclusive,
                days,
                "vs. período anterior",
                customStartDate,
                customEndDate,
                false
            );
        }

        return period switch
        {
            "today" => new PeriodFilterInfo(
                "today",
                DateTimeUtils.GetTodayStartUtc(),
                DateTimeUtils.GetTodayStartUtc().AddDays(1),
                1,
                "vs. ontem",
                brasiliaToday,
                brasiliaToday,
                false
            ),
            "yesterday" => new PeriodFilterInfo(
                "yesterday",
                DateTimeUtils.GetTodayStartUtc().AddDays(-1),
                DateTimeUtils.GetTodayStartUtc(),
                1,
                "vs. anteontem",
                brasiliaToday.AddDays(-1),
                brasiliaToday.AddDays(-1),
                false
            ),
            "7d" => new PeriodFilterInfo(
                "7d",
                now.AddDays(-7),
                null,
                7,
                "vs. 7 dias anteriores",
                brasiliaToday.AddDays(-6),
                brasiliaToday,
                false
            ),
            "14d" => new PeriodFilterInfo(
                "14d",
                now.AddDays(-14),
                null,
                14,
                "vs. 14 dias anteriores",
                brasiliaToday.AddDays(-13),
                brasiliaToday,
                false
            ),
            "30d" => new PeriodFilterInfo(
                "30d",
                now.AddDays(-30),
                null,
                30,
                "vs. 30 dias anteriores",
                brasiliaToday.AddDays(-29),
                brasiliaToday,
                false
            ),
            "90d" => new PeriodFilterInfo(
                "90d",
                now.AddDays(-90),
                null,
                90,
                "vs. 90 dias anteriores",
                brasiliaToday.AddDays(-89),
                brasiliaToday,
                false
            ),
            "this_week" => new PeriodFilterInfo(
                "this_week",
                DateTimeUtils.GetWeekStartUtc(),
                null,
                7,
                "vs. semana anterior",
                DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(DateTimeUtils.GetWeekStartUtc())),
                brasiliaToday,
                false
            ),
            "this_month" => new PeriodFilterInfo(
                "this_month",
                DateTimeUtils.GetMonthStartUtc(),
                null,
                30,
                "vs. mês anterior",
                new DateOnly(brasiliaToday.Year, brasiliaToday.Month, 1),
                brasiliaToday,
                false
            ),
            "all" => new PeriodFilterInfo(
                "all",
                DateTime.MinValue,
                null,
                0,
                string.Empty,
                brasiliaToday.AddDays(-29),
                brasiliaToday,
                true
            ),
            _ => new PeriodFilterInfo(
                "7d",
                now.AddDays(-7),
                null,
                7,
                "vs. 7 dias anteriores",
                brasiliaToday.AddDays(-6),
                brasiliaToday,
                false
            )
        };
    }

    private static bool TryParseCustomPeriod(string period, out DateOnly startDate, out DateOnly endDate)
    {
        startDate = default;
        endDate = default;

        if (!period.StartsWith("custom:", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var parts = period.Split(':');
        if (parts.Length != 3)
        {
            return false;
        }

        if (!DateOnly.TryParse(parts[1], out startDate) || !DateOnly.TryParse(parts[2], out endDate))
        {
            return false;
        }

        return startDate <= endDate;
    }

    public async Task Consume(ConsumeContext<ProcessAcquirerDashboardMessage> context)
    {
        var acquirerId = context.Message.AcquirerId;
        var period = context.Message.Period ?? "7d";

        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var dashboardHubService = scope.ServiceProvider.GetService<IDashboardHubService>();

        try
        {
            var now = DateTime.UtcNow;

            var cache = await dbContext.AcquirerDashboardCaches
                .FirstOrDefaultAsync(c => c.AcquirerId == acquirerId && c.Period == period);

            if (cache == null)
            {
                cache = new AcquirerDashboardCache
                {
                    Id = Guid.CreateVersion7(),
                    AcquirerId = acquirerId,
                    Period = period
                };
                dbContext.AcquirerDashboardCaches.Add(cache);
            }

            if (cache.NextProcessAt.HasValue && now < cache.NextProcessAt.Value && !cache.IsProcessing)
            {
                return;
            }

            var newData = await CalculateDashboardData(dbContext, acquirerId, period, now);

            UpdateCacheFromData(cache, newData, now);
            await dbContext.SaveChangesAsync();

            if (dashboardHubService != null)
            {
                await dashboardHubService.NotifyAcquirerDashboardUpdatedAsync(acquirerId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process acquirer dashboard for {AcquirerId} ({Period})", acquirerId, period);

            var cacheToReset = await dbContext.AcquirerDashboardCaches
                .FirstOrDefaultAsync(c => c.AcquirerId == acquirerId && c.Period == period);

            if (cacheToReset != null)
            {
                cacheToReset.IsProcessing = false;
                await dbContext.SaveChangesAsync();
            }

            throw;
        }
    }

    private static void UpdateCacheFromData(AcquirerDashboardCache cache, AcquirerDashboardCache newData, DateTime now)
    {
        cache.TotalMerchants = newData.TotalMerchants;
        cache.TotalTransactions = newData.TotalTransactions;
        cache.CompletedTransactions = newData.CompletedTransactions;
        cache.FailedTransactions = newData.FailedTransactions;
        cache.ExpiredTransactions = newData.ExpiredTransactions;
        cache.ApprovalRate = newData.ApprovalRate;
        cache.TotalVolume = newData.TotalVolume;
        cache.VolumeToday = newData.VolumeToday;
        cache.VolumeThisWeek = newData.VolumeThisWeek;
        cache.VolumeThisMonth = newData.VolumeThisMonth;
        cache.TotalAcquirerFees = newData.TotalAcquirerFees;
        cache.TotalPlatformFees = newData.TotalPlatformFees;
        cache.TotalProfit = newData.TotalProfit;
        cache.TotalPayouts = newData.TotalPayouts;
        cache.TotalPayoutVolume = newData.TotalPayoutVolume;
        cache.TotalPayoutAcquirerFees = newData.TotalPayoutAcquirerFees;
        cache.TotalPayoutPlatformFees = newData.TotalPayoutPlatformFees;
        cache.TotalPayoutProfit = newData.TotalPayoutProfit;
        cache.VolumeChartJson = newData.VolumeChartJson;
        cache.ProfitChartJson = newData.ProfitChartJson;
        cache.VolumeGrowth = newData.VolumeGrowth;
        cache.TransactionsGrowth = newData.TransactionsGrowth;
        cache.ApprovalRateGrowth = newData.ApprovalRateGrowth;
        cache.FailedRateGrowth = newData.FailedRateGrowth;
        cache.ProfitGrowth = newData.ProfitGrowth;
        cache.GrowthComparisonLabel = newData.GrowthComparisonLabel;
        cache.CalculatedAt = now;
        cache.ExpiresAt = now.AddMinutes(CacheDurationMinutes);
        cache.IsProcessing = false;
        cache.NextProcessAt = now.AddMinutes(CacheDurationMinutes);
    }

    private static async Task<AcquirerDashboardCache> CalculateDashboardData(
        PrimaryDbContext dbContext,
        Guid acquirerId,
        string period,
        DateTime now)
    {
        var todayStart = DateTimeUtils.GetTodayStartUtc();
        var weekStart = DateTimeUtils.GetWeekStartUtc();
        var monthStart = DateTimeUtils.GetMonthStartUtc();
        var periodFilter = ResolvePeriodFilter(period, now);
        var previousPeriodStart = periodFilter.PeriodStart.AddDays(-periodFilter.PeriodDays);

        var merchantAcquirerIds = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(ma => ma.AcquirerId == acquirerId)
            .Select(ma => ma.Id)
            .ToListAsync();

        var paymentStats = await dbContext.Payments
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId)
                     && p.CreatedAt >= periodFilter.PeriodStart
                     && (!periodFilter.PeriodEndExclusive.HasValue || p.CreatedAt < periodFilter.PeriodEndExclusive.Value))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed || p.Status == PaymentStatus.Cancelled),
                ExpiredTransactions = g.Count(p => p.Status == PaymentStatus.Expired),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                TotalAcquirerFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.AcquirerFee),
                TotalPlatformFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.PlatformFee),
                VolumeToday = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= todayStart).Sum(p => p.Amount),
                VolumeThisWeek = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= weekStart).Sum(p => p.Amount),
                VolumeThisMonth = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= monthStart).Sum(p => p.Amount)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var failedPayoutsQuery = dbContext.Payouts
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId)
                     && (p.Status == PayoutStatus.Failed
                         || p.Status == PayoutStatus.Rejected
                         || p.Status == PayoutStatus.Cancelled));

        if (!periodFilter.IsAll)
        {
            failedPayoutsQuery = failedPayoutsQuery.Where(p => p.CreatedAt >= periodFilter.PeriodStart);
            if (periodFilter.PeriodEndExclusive.HasValue)
            {
                failedPayoutsQuery = failedPayoutsQuery.Where(p => p.CreatedAt < periodFilter.PeriodEndExclusive.Value);
            }
        }

        var failedPayouts = await failedPayoutsQuery.CountAsync();

        var totalMerchants = await dbContext.MerchantAcquirers
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(ma => ma.AcquirerId == acquirerId)
            .Select(ma => ma.MerchantId)
            .Distinct()
            .CountAsync();

        var payoutQuery = dbContext.Payouts
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId) && p.Status == PayoutStatus.Completed);

        if (!periodFilter.IsAll)
        {
            payoutQuery = payoutQuery.Where(p => p.CreatedAt >= periodFilter.PeriodStart);
            if (periodFilter.PeriodEndExclusive.HasValue)
            {
                payoutQuery = payoutQuery.Where(p => p.CreatedAt < periodFilter.PeriodEndExclusive.Value);
            }
        }

        var payoutStats = await payoutQuery
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalPayouts = g.Count(),
                TotalPayoutVolume = g.Sum(p => p.Amount),
                TotalPayoutAcquirerFees = g.Sum(p => p.AcquirerFee),
                TotalPayoutPlatformFees = g.Sum(p => p.PlatformFee)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var totalTransactions = paymentStats?.TotalTransactions ?? 0;
        var completedTransactions = paymentStats?.CompletedTransactions ?? 0;
        var approvalRate = MathUtils.CalculatePercentage(completedTransactions, totalTransactions);

        var totalProfit = (paymentStats?.TotalPlatformFees ?? 0) - (paymentStats?.TotalAcquirerFees ?? 0);
        var totalPayoutProfit = (payoutStats?.TotalPayoutPlatformFees ?? 0) - (payoutStats?.TotalPayoutAcquirerFees ?? 0);

        (decimal? VolumeGrowth, decimal? TransactionsGrowth, decimal? ApprovalRateGrowth, decimal? FailedRateGrowth, decimal? ProfitGrowth) growthRates = (null, null, null, null, null);

        if (!periodFilter.IsAll && periodFilter.PeriodDays > 0)
        {
            var currentPeriodStats = await dbContext.Payments
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId)
                         && p.CreatedAt >= periodFilter.PeriodStart
                         && (!periodFilter.PeriodEndExclusive.HasValue || p.CreatedAt < periodFilter.PeriodEndExclusive.Value))
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    TotalTransactions = g.Count(),
                    CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                    FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed || p.Status == PaymentStatus.Cancelled),
                    ExpiredTransactions = g.Count(p => p.Status == PaymentStatus.Expired),
                    TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                    TotalPlatformFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.PlatformFee),
                    TotalAcquirerFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.AcquirerFee)
                })
                .OrderBy(_ => 1)
                .FirstOrDefaultAsync();

            var previousPeriodStats = await dbContext.Payments
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId)
                         && p.CreatedAt >= previousPeriodStart
                         && p.CreatedAt < periodFilter.PeriodStart)
                .GroupBy(_ => 1)
                .Select(g => new
                {
                    TotalTransactions = g.Count(),
                    CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                    FailedTransactions = g.Count(p => p.Status == PaymentStatus.Failed || p.Status == PaymentStatus.Cancelled),
                    ExpiredTransactions = g.Count(p => p.Status == PaymentStatus.Expired),
                    TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                    TotalPlatformFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.PlatformFee),
                    TotalAcquirerFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.AcquirerFee)
                })
                .OrderBy(_ => 1)
                .FirstOrDefaultAsync();

            growthRates = CalculateGrowthRates(currentPeriodStats, previousPeriodStats);
        }

        var volumeChart = await GenerateVolumeChart(dbContext, merchantAcquirerIds, periodFilter.ChartStartDate, periodFilter.ChartEndDate);
        var profitChart = await GenerateProfitChart(dbContext, merchantAcquirerIds, periodFilter.ChartStartDate, periodFilter.ChartEndDate);

        return new AcquirerDashboardCache
        {
            Id = Guid.NewGuid(),
            AcquirerId = acquirerId,
            Period = period,
            TotalMerchants = totalMerchants,
            TotalTransactions = totalTransactions,
            CompletedTransactions = completedTransactions,
            FailedTransactions = (paymentStats?.FailedTransactions ?? 0) + failedPayouts,
            ExpiredTransactions = paymentStats?.ExpiredTransactions ?? 0,
            ApprovalRate = approvalRate,
            TotalVolume = paymentStats?.TotalVolume ?? 0,
            VolumeToday = paymentStats?.VolumeToday ?? 0,
            VolumeThisWeek = paymentStats?.VolumeThisWeek ?? 0,
            VolumeThisMonth = paymentStats?.VolumeThisMonth ?? 0,
            TotalAcquirerFees = paymentStats?.TotalAcquirerFees ?? 0,
            TotalPlatformFees = paymentStats?.TotalPlatformFees ?? 0,
            TotalProfit = totalProfit,
            TotalPayouts = payoutStats?.TotalPayouts ?? 0,
            TotalPayoutVolume = payoutStats?.TotalPayoutVolume ?? 0,
            TotalPayoutAcquirerFees = payoutStats?.TotalPayoutAcquirerFees ?? 0,
            TotalPayoutPlatformFees = payoutStats?.TotalPayoutPlatformFees ?? 0,
            TotalPayoutProfit = totalPayoutProfit,
            VolumeChartJson = volumeChart,
            ProfitChartJson = profitChart,
            VolumeGrowth = growthRates.VolumeGrowth,
            TransactionsGrowth = growthRates.TransactionsGrowth,
            ApprovalRateGrowth = growthRates.ApprovalRateGrowth,
            FailedRateGrowth = growthRates.FailedRateGrowth,
            ProfitGrowth = growthRates.ProfitGrowth,
            GrowthComparisonLabel = periodFilter.GrowthLabel,
            CalculatedAt = now,
            ExpiresAt = now.AddMinutes(CacheDurationMinutes)
        };
    }

    private static (decimal? VolumeGrowth, decimal? TransactionsGrowth, decimal? ApprovalRateGrowth, decimal? FailedRateGrowth, decimal? ProfitGrowth)
        CalculateGrowthRates(dynamic? thisWeekStats, dynamic? lastWeekStats)
    {
        decimal? volumeGrowth = null;
        decimal? transactionsGrowth = null;
        decimal? approvalRateGrowth = null;
        decimal? failedRateGrowth = null;
        decimal? profitGrowth = null;

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

        var thisWeekFailed = (int)(thisWeekStats?.FailedTransactions ?? 0) + (int)(thisWeekStats?.ExpiredTransactions ?? 0);
        var lastWeekFailed = (int)(lastWeekStats?.FailedTransactions ?? 0) + (int)(lastWeekStats?.ExpiredTransactions ?? 0);
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

        var thisWeekProfit = (long)(thisWeekStats?.TotalPlatformFees ?? 0) - (long)(thisWeekStats?.TotalAcquirerFees ?? 0);
        var lastWeekProfit = (long)(lastWeekStats?.TotalPlatformFees ?? 0) - (long)(lastWeekStats?.TotalAcquirerFees ?? 0);

        if (lastWeekProfit > 0)
        {
            profitGrowth = Math.Round(((decimal)(thisWeekProfit - lastWeekProfit) / lastWeekProfit) * 100, 1);
        }
        else if (thisWeekProfit > 0)
        {
            profitGrowth = 100;
        }

        return (volumeGrowth, transactionsGrowth, approvalRateGrowth, failedRateGrowth, profitGrowth);
    }

    private static async Task<string> GenerateVolumeChart(
        PrimaryDbContext dbContext,
        List<Guid> merchantAcquirerIds,
        DateOnly chartStartDate,
        DateOnly chartEndDate)
    {
        var chartStartUtc = DateTime.SpecifyKind(chartStartDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var chartEndUtcExclusive = DateTime.SpecifyKind(chartEndDate.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

        var chartData = await dbContext.Payments
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId)
                     && p.Status == PaymentStatus.Completed
                     && p.CompletedAt >= chartStartUtc
                     && p.CompletedAt < chartEndUtcExclusive)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                Value = g.Sum(p => p.Amount)
            })
            .ToListAsync();

        var totalDays = Math.Max(1, chartEndDate.DayNumber - chartStartDate.DayNumber + 1);

        var chart = Enumerable.Range(0, totalDays)
            .Select(i => chartStartDate.AddDays(i))
            .Select(date =>
            {
                var dayData = chartData.FirstOrDefault(c => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(c.Date)) == date);
                return new AdminAcquirerChartItem
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Value = dayData?.Value ?? 0
                };
            })
            .ToList();

        return JsonSerializer.Serialize(chart);
    }

    private static async Task<string> GenerateProfitChart(
        PrimaryDbContext dbContext,
        List<Guid> merchantAcquirerIds,
        DateOnly chartStartDate,
        DateOnly chartEndDate)
    {
        var chartStartUtc = DateTime.SpecifyKind(chartStartDate.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var chartEndUtcExclusive = DateTime.SpecifyKind(chartEndDate.AddDays(1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

        var chartData = await dbContext.Payments
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(p => merchantAcquirerIds.Contains(p.MerchantAcquirerId)
                     && p.Status == PaymentStatus.Completed
                     && p.CompletedAt >= chartStartUtc
                     && p.CompletedAt < chartEndUtcExclusive)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                Profit = g.Sum(p => p.PlatformFee) - g.Sum(p => p.AcquirerFee)
            })
            .ToListAsync();

        var totalDays = Math.Max(1, chartEndDate.DayNumber - chartStartDate.DayNumber + 1);

        var chart = Enumerable.Range(0, totalDays)
            .Select(i => chartStartDate.AddDays(i))
            .Select(date =>
            {
                var dayData = chartData.FirstOrDefault(c => DateOnly.FromDateTime(DateTimeUtils.ToBrasiliaTime(c.Date)) == date);
                return new AdminAcquirerChartItem
                {
                    Date = date.ToString("yyyy-MM-dd"),
                    Value = dayData?.Profit ?? 0
                };
            })
            .ToList();

        return JsonSerializer.Serialize(chart);
    }
}

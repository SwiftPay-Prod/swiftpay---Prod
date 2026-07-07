using System.Text.Json;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Dashboard;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Services;
using swiftpay_api_core.Utils;

namespace swiftpay_api_core.Consumers;

public sealed class ProcessAdminDashboardConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessAdminDashboardConsumer> logger
) : IConsumer<ProcessAdminDashboardMessage>
{
    private const int CacheDurationMinutes = 5;

    public async Task Consume(ConsumeContext<ProcessAdminDashboardMessage> context)
    {
        var environment = context.Message.Environment;

        // Setar o environment ANTES de criar o scope para que o DbContext use o QueryFilter correto
        using var environmentScope = HybridEnvironmentProvider.SetEnvironment(environment);
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var dashboardHubService = scope.ServiceProvider.GetService<IDashboardHubService>();

        try
        {
            var now = DateTime.UtcNow;

            var cache = await dbContext.AdminDashboardCaches
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync();

            if (cache == null)
            {
                logger.LogError("Admin dashboard cache not found for environment {Environment}. Skipping.", environment);
                return;
            }

            if (cache.NextProcessAt.HasValue && now < cache.NextProcessAt.Value && !cache.IsProcessing)
            {
                return;
            }

            var newData = await CalculateDashboardData(dbContext, now);

            UpdateCacheFromData(cache, newData, now);
            await dbContext.SaveChangesAsync();

            if (dashboardHubService != null)
            {
                await dashboardHubService.NotifyAdminDashboardUpdatedAsync(environment);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process admin dashboard for environment {Environment}", environment);

            var cacheToReset = await dbContext.AdminDashboardCaches
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

    private static void UpdateCacheFromData(AdminDashboardCache cache, AdminDashboardCache newData, DateTime now)
    {
        cache.TotalUsers = newData.TotalUsers;
        cache.ActiveUsers = newData.ActiveUsers;
        cache.InactiveUsers = newData.InactiveUsers;
        cache.SuspendedUsers = newData.SuspendedUsers;
        cache.EmailVerifiedUsers = newData.EmailVerifiedUsers;
        cache.NewUsersToday = newData.NewUsersToday;
        cache.NewUsersThisWeek = newData.NewUsersThisWeek;
        cache.NewUsersThisMonth = newData.NewUsersThisMonth;
        cache.TotalMerchants = newData.TotalMerchants;
        cache.ActiveMerchants = newData.ActiveMerchants;
        cache.DraftMerchants = newData.DraftMerchants;
        cache.SuspendedMerchants = newData.SuspendedMerchants;
        cache.PendingKycMerchants = newData.PendingKycMerchants;
        cache.ApprovedKycMerchants = newData.ApprovedKycMerchants;
        cache.RejectedKycMerchants = newData.RejectedKycMerchants;
        cache.NewMerchantsThisMonth = newData.NewMerchantsThisMonth;
        cache.TotalVolume = newData.TotalVolume;
        cache.TotalFees = newData.TotalFees;
        cache.VolumeToday = newData.VolumeToday;
        cache.FeesToday = newData.FeesToday;
        cache.VolumeThisWeek = newData.VolumeThisWeek;
        cache.FeesThisWeek = newData.FeesThisWeek;
        cache.VolumeThisMonth = newData.VolumeThisMonth;
        cache.FeesThisMonth = newData.FeesThisMonth;
        cache.TotalTransactions = newData.TotalTransactions;
        cache.CompletedTransactions = newData.CompletedTransactions;
        cache.FailedTransactions = newData.FailedTransactions;
        cache.PendingTransactions = newData.PendingTransactions;
        cache.ApprovalRate = newData.ApprovalRate;
        cache.TotalPayouts = newData.TotalPayouts;
        cache.TotalPayoutAmount = newData.TotalPayoutAmount;
        cache.PayoutFeesTotal = newData.PayoutFeesTotal;
        cache.PayoutAcquirerFeesTotal = newData.PayoutAcquirerFeesTotal;
        cache.PayoutFeesToday = newData.PayoutFeesToday;
        cache.PayoutAcquirerFeesToday = newData.PayoutAcquirerFeesToday;
        cache.PayoutFeesThisWeek = newData.PayoutFeesThisWeek;
        cache.PayoutAcquirerFeesThisWeek = newData.PayoutAcquirerFeesThisWeek;
        cache.PayoutFeesThisMonth = newData.PayoutFeesThisMonth;
        cache.PayoutAcquirerFeesThisMonth = newData.PayoutAcquirerFeesThisMonth;
        cache.TotalAcquirerFees = newData.TotalAcquirerFees;
        cache.AcquirerFeesToday = newData.AcquirerFeesToday;
        cache.AcquirerFeesThisWeek = newData.AcquirerFeesThisWeek;
        cache.AcquirerFeesThisMonth = newData.AcquirerFeesThisMonth;
        cache.VolumeChartJson = newData.VolumeChartJson;
        cache.RegistrationChartJson = newData.RegistrationChartJson;
        cache.CalculatedAt = now;
        cache.ExpiresAt = now.AddMinutes(CacheDurationMinutes);
        cache.IsProcessing = false;
        cache.NextProcessAt = now.AddMinutes(CacheDurationMinutes);
    }

    private static async Task<AdminDashboardCache> CalculateDashboardData(PrimaryDbContext dbContext, DateTime now)
    {
        var todayUtc = DateTimeUtils.GetTodayStartUtc();
        var startOfWeekUtc = DateTimeUtils.GetWeekStartUtc();
        var startOfMonthUtc = DateTimeUtils.GetMonthStartUtc();
        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDateTime();

        var userStats = await dbContext.Users
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalUsers = g.Count(),
                ActiveUsers = g.Count(u => u.Status == UserStatus.Active),
                InactiveUsers = g.Count(u => u.Status == UserStatus.Inactive),
                SuspendedUsers = g.Count(u => u.Status == UserStatus.Suspended),
                EmailVerifiedUsers = g.Count(u => u.EmailVerified),
                NewUsersToday = g.Count(u => u.CreatedAt >= todayUtc),
                NewUsersThisWeek = g.Count(u => u.CreatedAt >= startOfWeekUtc),
                NewUsersThisMonth = g.Count(u => u.CreatedAt >= startOfMonthUtc)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var merchantStats = await dbContext.Merchants
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalMerchants = g.Count(),
                ActiveMerchants = g.Count(m => m.Status == MerchantStatus.Active),
                DraftMerchants = g.Count(m => m.Status == MerchantStatus.Draft),
                SuspendedMerchants = g.Count(m => m.Status == MerchantStatus.Suspended),
                PendingKycMerchants = g.Count(m => m.KycStatus == MerchantKycStatus.Pending || m.KycStatus == MerchantKycStatus.UnderReview),
                ApprovedKycMerchants = g.Count(m => m.KycStatus == MerchantKycStatus.Approved),
                RejectedKycMerchants = g.Count(m => m.KycStatus == MerchantKycStatus.Rejected),
                NewMerchantsThisMonth = g.Count(m => m.CreatedAt >= startOfMonthUtc)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var paymentStats = await dbContext.Payments
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalTransactions = g.Count(),
                CompletedTransactions = g.Count(p => p.Status == PaymentStatus.Completed),
                FailedTransactions = g.Count(
                    p => p.Status == PaymentStatus.Failed
                      || p.Status == PaymentStatus.Cancelled
                      || p.Status == PaymentStatus.Expired),
                PendingTransactions = g.Count(p => p.Status == PaymentStatus.Pending),
                TotalVolume = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount),
                TotalFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.PlatformFee),
                TotalAcquirerFees = g.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.AcquirerFee),
                VolumeToday = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= todayUtc).Sum(p => p.Amount),
                FeesToday = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= todayUtc).Sum(p => p.PlatformFee),
                AcquirerFeesToday = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= todayUtc).Sum(p => p.AcquirerFee),
                VolumeThisWeek = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startOfWeekUtc).Sum(p => p.Amount),
                FeesThisWeek = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startOfWeekUtc).Sum(p => p.PlatformFee),
                AcquirerFeesThisWeek = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startOfWeekUtc).Sum(p => p.AcquirerFee),
                VolumeThisMonth = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startOfMonthUtc).Sum(p => p.Amount),
                FeesThisMonth = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startOfMonthUtc).Sum(p => p.PlatformFee),
                AcquirerFeesThisMonth = g.Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= startOfMonthUtc).Sum(p => p.AcquirerFee)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var payoutStats = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                TotalPayouts = g.Count(),
                TotalPayoutAmount = g.Sum(p => p.Amount),
                TotalPayoutFees = g.Sum(p => p.PlatformFee),
                TotalPayoutAcquirerFees = g.Sum(p => p.AcquirerFee),
                PayoutFeesToday = g.Where(p => p.CompletedAt >= todayUtc).Sum(p => p.PlatformFee),
                PayoutAcquirerFeesToday = g.Where(p => p.CompletedAt >= todayUtc).Sum(p => p.AcquirerFee),
                PayoutFeesThisWeek = g.Where(p => p.CompletedAt >= startOfWeekUtc).Sum(p => p.PlatformFee),
                PayoutAcquirerFeesThisWeek = g.Where(p => p.CompletedAt >= startOfWeekUtc).Sum(p => p.AcquirerFee),
                PayoutFeesThisMonth = g.Where(p => p.CompletedAt >= startOfMonthUtc).Sum(p => p.PlatformFee),
                PayoutAcquirerFeesThisMonth = g.Where(p => p.CompletedAt >= startOfMonthUtc).Sum(p => p.AcquirerFee)
            })
            .OrderBy(_ => 1)
            .FirstOrDefaultAsync();

        var totalTransactions = paymentStats?.TotalTransactions ?? 0;
        var completedTransactions = paymentStats?.CompletedTransactions ?? 0;
        var approvalRate = MathUtils.CalculatePercentage(completedTransactions, totalTransactions);

        var sevenDaysAgoUtc = DateTimeUtils.GetDaysAgoUtc(7);

        var volumeChartData = await dbContext.Payments
            .AsNoTracking()
            .Where(p => p.Status == PaymentStatus.Completed && p.CompletedAt >= sevenDaysAgoUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                Volume = g.Sum(p => p.Amount),
                Fees = g.Sum(p => p.PlatformFee),
                AcquirerFees = g.Sum(p => p.AcquirerFee),
                TransactionCount = g.Count()
            })
            .ToListAsync();

        var payoutChartData = await dbContext.Payouts
            .AsNoTracking()
            .Where(p => p.Status == PayoutStatus.Completed && p.CompletedAt >= sevenDaysAgoUtc)
            .GroupBy(p => p.CompletedAt!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                PayoutFees = g.Sum(p => p.PlatformFee),
                PayoutAcquirerFees = g.Sum(p => p.AcquirerFee)
            })
            .ToListAsync();

        var volumeChart = Enumerable.Range(0, 7)
            .Select(i => brasiliaToday.AddDays(-6 + i))
            .Select(date =>
            {
                var dayData = volumeChartData.FirstOrDefault(c => DateTimeUtils.ToBrasiliaTime(c.Date).Date == date);
                var payoutDayData = payoutChartData.FirstOrDefault(c => DateTimeUtils.ToBrasiliaTime(c.Date).Date == date);
                return new AdminDailyVolumeData
                {
                    Date = DateOnly.FromDateTime(date),
                    Volume = dayData?.Volume ?? 0,
                    Fees = dayData?.Fees ?? 0,
                    AcquirerFees = dayData?.AcquirerFees ?? 0,
                    PayoutFees = payoutDayData?.PayoutFees ?? 0,
                    PayoutAcquirerFees = payoutDayData?.PayoutAcquirerFees ?? 0,
                    TransactionCount = dayData?.TransactionCount ?? 0,
                    CompletedTransactions = dayData?.TransactionCount ?? 0,
                    FailedTransactions = 0
                };
            })
            .ToList();

        var userRegistrationData = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.CreatedAt >= sevenDaysAgoUtc)
            .GroupBy(u => u.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        var merchantRegistrationData = await dbContext.Merchants
            .AsNoTracking()
            .Where(m => m.CreatedAt >= sevenDaysAgoUtc)
            .GroupBy(m => m.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        var registrationChart = Enumerable.Range(0, 7)
            .Select(i => brasiliaToday.AddDays(-6 + i))
            .Select(date => new AdminDailyRegistrationData
            {
                Date = DateOnly.FromDateTime(date),
                NewUsers = userRegistrationData.FirstOrDefault(d => DateTimeUtils.ToBrasiliaTime(d.Date).Date == date)?.Count ?? 0,
                NewMerchants = merchantRegistrationData.FirstOrDefault(d => DateTimeUtils.ToBrasiliaTime(d.Date).Date == date)?.Count ?? 0
            })
            .ToList();

        return new AdminDashboardCache
        {
            Id = Guid.NewGuid(),
            TotalUsers = userStats?.TotalUsers ?? 0,
            ActiveUsers = userStats?.ActiveUsers ?? 0,
            InactiveUsers = userStats?.InactiveUsers ?? 0,
            SuspendedUsers = userStats?.SuspendedUsers ?? 0,
            EmailVerifiedUsers = userStats?.EmailVerifiedUsers ?? 0,
            NewUsersToday = userStats?.NewUsersToday ?? 0,
            NewUsersThisWeek = userStats?.NewUsersThisWeek ?? 0,
            NewUsersThisMonth = userStats?.NewUsersThisMonth ?? 0,
            TotalMerchants = merchantStats?.TotalMerchants ?? 0,
            ActiveMerchants = merchantStats?.ActiveMerchants ?? 0,
            DraftMerchants = merchantStats?.DraftMerchants ?? 0,
            SuspendedMerchants = merchantStats?.SuspendedMerchants ?? 0,
            PendingKycMerchants = merchantStats?.PendingKycMerchants ?? 0,
            ApprovedKycMerchants = merchantStats?.ApprovedKycMerchants ?? 0,
            RejectedKycMerchants = merchantStats?.RejectedKycMerchants ?? 0,
            NewMerchantsThisMonth = merchantStats?.NewMerchantsThisMonth ?? 0,
            TotalVolume = paymentStats?.TotalVolume ?? 0,
            TotalFees = paymentStats?.TotalFees ?? 0,
            VolumeToday = paymentStats?.VolumeToday ?? 0,
            FeesToday = paymentStats?.FeesToday ?? 0,
            VolumeThisWeek = paymentStats?.VolumeThisWeek ?? 0,
            FeesThisWeek = paymentStats?.FeesThisWeek ?? 0,
            VolumeThisMonth = paymentStats?.VolumeThisMonth ?? 0,
            FeesThisMonth = paymentStats?.FeesThisMonth ?? 0,
            TotalTransactions = totalTransactions,
            CompletedTransactions = completedTransactions,
            FailedTransactions = paymentStats?.FailedTransactions ?? 0,
            PendingTransactions = paymentStats?.PendingTransactions ?? 0,
            ApprovalRate = approvalRate,
            TotalPayouts = payoutStats?.TotalPayouts ?? 0,
            TotalPayoutAmount = payoutStats?.TotalPayoutAmount ?? 0,
            PayoutFeesTotal = payoutStats?.TotalPayoutFees ?? 0,
            PayoutAcquirerFeesTotal = payoutStats?.TotalPayoutAcquirerFees ?? 0,
            PayoutFeesToday = payoutStats?.PayoutFeesToday ?? 0,
            PayoutAcquirerFeesToday = payoutStats?.PayoutAcquirerFeesToday ?? 0,
            PayoutFeesThisWeek = payoutStats?.PayoutFeesThisWeek ?? 0,
            PayoutAcquirerFeesThisWeek = payoutStats?.PayoutAcquirerFeesThisWeek ?? 0,
            PayoutFeesThisMonth = payoutStats?.PayoutFeesThisMonth ?? 0,
            PayoutAcquirerFeesThisMonth = payoutStats?.PayoutAcquirerFeesThisMonth ?? 0,
            TotalAcquirerFees = paymentStats?.TotalAcquirerFees ?? 0,
            AcquirerFeesToday = paymentStats?.AcquirerFeesToday ?? 0,
            AcquirerFeesThisWeek = paymentStats?.AcquirerFeesThisWeek ?? 0,
            AcquirerFeesThisMonth = paymentStats?.AcquirerFeesThisMonth ?? 0,
            VolumeChartJson = JsonSerializer.Serialize(volumeChart),
            RegistrationChartJson = JsonSerializer.Serialize(registrationChart),
            CalculatedAt = now,
            ExpiresAt = now.AddMinutes(CacheDurationMinutes)
        };
    }
}

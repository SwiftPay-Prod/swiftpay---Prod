using safefy_api.Endpoints.Admin.ReadAdminDashboard;
using safefy_api_core.Models.Dashboard;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Mappers;

public static class AdminDashboardMapper
{
    public static AdminDashboardData ToData(
        AdminDashboardCache? cache,
        List<AdminDailyVolumeData> volumeChart,
        List<AdminDailyRegistrationData> registrationChart,
        int cacheDurationMinutes,
        AdminDashboardPeriodInfo? periodInfo = null,
        AdminDashboardGrowthKpis? growth = null) => new()
    {
        Users = ToUserKpis(cache),
        Merchants = ToMerchantKpis(cache),
        Financial = ToFinancialKpis(cache),
        VolumeChart = volumeChart,
        RegistrationChart = registrationChart,
        CacheInfo = ToCacheInfo(cache, cacheDurationMinutes),
        PeriodInfo = periodInfo ?? ToDefaultPeriodInfo(),
        Growth = growth ?? new AdminDashboardGrowthKpis()
    };

    public static AdminDashboardData ToFilteredData(
        AdminUserKpis users,
        AdminMerchantKpis merchants,
        AdminFinancialKpis financial,
        List<AdminDailyVolumeData> volumeChart,
        List<AdminDailyRegistrationData> registrationChart,
        AdminDashboardPeriodInfo periodInfo,
        AdminDashboardGrowthKpis growth,
        DateTime calculatedAt) => new()
    {
        Users = users,
        Merchants = merchants,
        Financial = financial,
        VolumeChart = volumeChart,
        RegistrationChart = registrationChart,
        PeriodInfo = periodInfo,
        Growth = growth,
        CacheInfo = new AdminDashboardCacheInfo
        {
            LastUpdatedAt = calculatedAt,
            NextUpdateAt = null,
            CacheDurationMinutes = 0,
            IsProcessing = false
        }
    };

    public static AdminUserKpis ToUserKpis(AdminDashboardCache? cache) => new()
    {
        TotalUsers = cache?.TotalUsers ?? 0,
        ActiveUsers = cache?.ActiveUsers ?? 0,
        InactiveUsers = cache?.InactiveUsers ?? 0,
        SuspendedUsers = cache?.SuspendedUsers ?? 0,
        EmailVerifiedUsers = cache?.EmailVerifiedUsers ?? 0,
        NewUsersToday = cache?.NewUsersToday ?? 0,
        NewUsersThisWeek = cache?.NewUsersThisWeek ?? 0,
        NewUsersThisMonth = cache?.NewUsersThisMonth ?? 0
    };

    public static AdminMerchantKpis ToMerchantKpis(AdminDashboardCache? cache) => new()
    {
        TotalMerchants = cache?.TotalMerchants ?? 0,
        ActiveMerchants = cache?.ActiveMerchants ?? 0,
        DraftMerchants = cache?.DraftMerchants ?? 0,
        SuspendedMerchants = cache?.SuspendedMerchants ?? 0,
        PendingKycMerchants = cache?.PendingKycMerchants ?? 0,
        ApprovedKycMerchants = cache?.ApprovedKycMerchants ?? 0,
        RejectedKycMerchants = cache?.RejectedKycMerchants ?? 0,
        NewMerchantsThisMonth = cache?.NewMerchantsThisMonth ?? 0
    };

    public static AdminFinancialKpis ToFinancialKpis(AdminDashboardCache? cache)
    {
        var paymentFees = cache?.TotalFees ?? 0;
        var paymentAcquirerFees = cache?.TotalAcquirerFees ?? 0;
        var paymentFeesToday = cache?.FeesToday ?? 0;
        var paymentAcquirerFeesToday = cache?.AcquirerFeesToday ?? 0;
        var paymentFeesThisWeek = cache?.FeesThisWeek ?? 0;
        var paymentAcquirerFeesThisWeek = cache?.AcquirerFeesThisWeek ?? 0;
        var paymentFeesThisMonth = cache?.FeesThisMonth ?? 0;
        var paymentAcquirerFeesThisMonth = cache?.AcquirerFeesThisMonth ?? 0;

        var payoutFees = cache?.PayoutFeesTotal ?? 0;
        var payoutAcquirerFees = cache?.PayoutAcquirerFeesTotal ?? 0;
        var payoutFeesToday = cache?.PayoutFeesToday ?? 0;
        var payoutAcquirerFeesToday = cache?.PayoutAcquirerFeesToday ?? 0;
        var payoutFeesThisWeek = cache?.PayoutFeesThisWeek ?? 0;
        var payoutAcquirerFeesThisWeek = cache?.PayoutAcquirerFeesThisWeek ?? 0;
        var payoutFeesThisMonth = cache?.PayoutFeesThisMonth ?? 0;
        var payoutAcquirerFeesThisMonth = cache?.PayoutAcquirerFeesThisMonth ?? 0;

        var totalFees = paymentFees + payoutFees;
        var totalAcquirerFees = paymentAcquirerFees + payoutAcquirerFees;
        var feesToday = paymentFeesToday + payoutFeesToday;
        var acquirerFeesToday = paymentAcquirerFeesToday + payoutAcquirerFeesToday;
        var feesThisWeek = paymentFeesThisWeek + payoutFeesThisWeek;
        var acquirerFeesThisWeek = paymentAcquirerFeesThisWeek + payoutAcquirerFeesThisWeek;
        var feesThisMonth = paymentFeesThisMonth + payoutFeesThisMonth;
        var acquirerFeesThisMonth = paymentAcquirerFeesThisMonth + payoutAcquirerFeesThisMonth;

        return new()
        {
            TotalVolume = cache?.TotalVolume ?? 0,
            TotalFees = totalFees,
            TotalAcquirerFees = totalAcquirerFees,
            TotalNetRevenue = totalFees - totalAcquirerFees,
            VolumeToday = cache?.VolumeToday ?? 0,
            FeesToday = feesToday,
            AcquirerFeesToday = acquirerFeesToday,
            NetRevenueToday = feesToday - acquirerFeesToday,
            VolumeThisWeek = cache?.VolumeThisWeek ?? 0,
            FeesThisWeek = feesThisWeek,
            AcquirerFeesThisWeek = acquirerFeesThisWeek,
            NetRevenueThisWeek = feesThisWeek - acquirerFeesThisWeek,
            VolumeThisMonth = cache?.VolumeThisMonth ?? 0,
            FeesThisMonth = feesThisMonth,
            AcquirerFeesThisMonth = acquirerFeesThisMonth,
            NetRevenueThisMonth = feesThisMonth - acquirerFeesThisMonth,
            TotalTransactions = cache?.TotalTransactions ?? 0,
            CompletedTransactions = cache?.CompletedTransactions ?? 0,
            FailedTransactions = cache?.FailedTransactions ?? 0,
            PendingTransactions = cache?.PendingTransactions ?? 0,
            ApprovalRate = cache?.ApprovalRate ?? 0,
            FailedRate = (cache?.TotalTransactions ?? 0) > 0
                ? Math.Round(((cache?.FailedTransactions ?? 0) / (decimal)(cache?.TotalTransactions ?? 0)) * 100, 2)
                : 0,
            NetMarginPercentage = (cache?.TotalVolume ?? 0) > 0
                ? Math.Round(((totalFees - totalAcquirerFees) / (decimal)(cache?.TotalVolume ?? 0)) * 100, 2)
                : 0,
            TotalPayouts = cache?.TotalPayouts ?? 0,
            TotalPayoutAmount = cache?.TotalPayoutAmount ?? 0,
            TotalPayoutFees = payoutFees,
            TotalPayoutAcquirerFees = payoutAcquirerFees
        };
    }

    public static AdminDashboardCacheInfo ToCacheInfo(AdminDashboardCache? cache, int cacheDurationMinutes) => new()
    {
        LastUpdatedAt = cache?.CalculatedAt,
        NextUpdateAt = cache?.ExpiresAt,
        CacheDurationMinutes = cacheDurationMinutes,
        IsProcessing = cache?.IsProcessing ?? false
    };

    public static AdminDashboardPeriodInfo ToDefaultPeriodInfo()
    {
        var today = DateTimeUtils.GetBrasiliaTodayDate();
        return new AdminDashboardPeriodInfo
        {
            Period = "7d",
            StartDate = today.AddDays(-6),
            EndDate = today,
            Label = "Ultimos 7 dias"
        };
    }
}

using safefy_api.Endpoints.Merchants.ReadMerchantDashboard;
using safefy_api_core.Models.Dashboard;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Ledger;

namespace safefy_api.Mappers;

public static class MerchantDashboardMapper
{
    public static ReadMerchantDashboardData ToData(
        MerchantDashboardCache? cache,
        MerchantBalanceInfo balanceInfo,
        List<MerchantDailyVolumeData> volumeChart,
        List<MerchantWeeklyVolumeData> weeklyChart,
        int cacheDurationMinutes) => new()
    {
        Kpis = ToKpiData(cache, balanceInfo),
        Balance = ToBalanceData(balanceInfo),
        VolumeChart = volumeChart,
        WeeklyChart = weeklyChart,
        CacheInfo = ToCacheInfo(cache, cacheDurationMinutes)
    };

    public static MerchantKpiData ToKpiData(MerchantDashboardCache? cache, MerchantBalanceInfo balanceInfo)
    {
        var approvalRate = cache?.ApprovalRate ?? 0;
        return new()
        {
            TotalSales = balanceInfo.LifetimeVolume,
            TotalVolume = balanceInfo.LifetimeVolume,
            TotalFees = balanceInfo.LifetimeFeesPaid,
            TotalNetVolume = balanceInfo.LifetimeVolume - balanceInfo.LifetimeFeesPaid,
            TotalPayouts = balanceInfo.LifetimePayouts,
            PendingPayouts = 0,
            RefundedAmount = 0,
            RefundedTransactions = 0,
            VolumeToday = balanceInfo.VolumeToday,
            VolumeThisWeek = balanceInfo.VolumeThisWeek,
            VolumeThisMonth = balanceInfo.VolumeThisMonth,
            ApprovalRate = approvalRate,
            ApprovalRateLevel = MerchantKpiData.GetApprovalRateLevel(approvalRate),
            ChargebackCount = cache?.ChargebackCount ?? 0,
            ChargebackRate = cache?.ChargebackRate ?? 0,
            FailedTransactions = cache?.FailedTransactions ?? 0,
            FailedRate = cache?.FailedRate ?? 0,
            TotalTransactions = cache?.TotalTransactions ?? 0,
            CompletedTransactions = cache?.CompletedTransactions ?? 0
        };
    }

    public static MerchantKpiData ToKpiData(MerchantDashboardCache? cache)
    {
        var approvalRate = cache?.ApprovalRate ?? 0;
        return new()
        {
            TotalSales = cache?.TotalVolume ?? 0,
            TotalVolume = cache?.TotalVolume ?? 0,
            TotalFees = cache?.TotalFees ?? 0,
            TotalNetVolume = (cache?.TotalVolume ?? 0) - (cache?.TotalFees ?? 0),
            TotalPayouts = cache?.TotalPayouts ?? 0,
            PendingPayouts = 0,
            RefundedAmount = 0,
            RefundedTransactions = 0,
            VolumeToday = cache?.VolumeToday ?? 0,
            VolumeThisWeek = cache?.VolumeThisWeek ?? 0,
            VolumeThisMonth = cache?.VolumeThisMonth ?? 0,
            ApprovalRate = approvalRate,
            ApprovalRateLevel = MerchantKpiData.GetApprovalRateLevel(approvalRate),
            ChargebackCount = cache?.ChargebackCount ?? 0,
            ChargebackRate = cache?.ChargebackRate ?? 0,
            FailedTransactions = cache?.FailedTransactions ?? 0,
            FailedRate = cache?.FailedRate ?? 0,
            TotalTransactions = cache?.TotalTransactions ?? 0,
            CompletedTransactions = cache?.CompletedTransactions ?? 0
        };
    }

    public static MerchantBalanceData ToBalanceData(MerchantBalanceInfo balanceInfo) => new()
    {
        Currency = balanceInfo.Currency,
        Available = balanceInfo.Available,
        Pending = balanceInfo.Pending,
        Reserved = balanceInfo.Reserved,
        Total = balanceInfo.Total
    };

    public static DashboardCacheInfo ToCacheInfo(MerchantDashboardCache? cache, int cacheDurationMinutes) => new()
    {
        LastUpdatedAt = cache?.CalculatedAt,
        NextUpdateAt = cache?.ExpiresAt,
        CacheDurationMinutes = cacheDurationMinutes,
        IsProcessing = cache?.IsProcessing ?? false
    };
}

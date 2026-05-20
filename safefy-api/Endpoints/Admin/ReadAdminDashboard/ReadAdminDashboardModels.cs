using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Dashboard;

namespace safefy_api.Endpoints.Admin.ReadAdminDashboard;

public sealed class ReadAdminDashboardRequest
{
    /// <summary>
    /// Periodo pre-definido: today, yesterday, 7d, 14d, 30d, 90d, this_week, this_month, all, custom.
    /// </summary>
    [QueryParam, BindFrom("period")]
    public string? Period { get; set; }

    /// <summary>
    /// Data de inicio (formato: yyyy-MM-dd).
    /// </summary>
    [QueryParam, BindFrom("startDate")]
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Data de fim (formato: yyyy-MM-dd).
    /// </summary>
    [QueryParam, BindFrom("endDate")]
    public DateOnly? EndDate { get; set; }
}

public sealed class ReadAdminDashboardValidator : Validator<ReadAdminDashboardRequest>
{
    public ReadAdminDashboardValidator()
    {
        RuleFor(x => x.Period)
            .Must(p => p == null || new[] { "today", "yesterday", "7d", "14d", "30d", "90d", "this_week", "this_month", "all", "custom" }.Contains(p))
            .When(x => x.Period != null)
            .WithMessage("Periodo invalido. Use: today, yesterday, 7d, 14d, 30d, 90d, this_week, this_month, all ou custom.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual a data inicial.");
    }
}

public sealed class ReadAdminDashboardResponse : BaseResponse<AdminDashboardData>;

public sealed class AdminDashboardData
{
    public AdminUserKpis Users { get; set; } = null!;
    public AdminMerchantKpis Merchants { get; set; } = null!;
    public AdminFinancialKpis Financial { get; set; } = null!;
    public IEnumerable<AdminDailyVolumeData> VolumeChart { get; set; } = [];
    public IEnumerable<AdminDailyRegistrationData> RegistrationChart { get; set; } = [];
    public AdminDashboardCacheInfo CacheInfo { get; set; } = null!;
    public AdminDashboardPeriodInfo PeriodInfo { get; set; } = null!;
    public AdminDashboardGrowthKpis Growth { get; set; } = new();
}

public sealed class AdminDashboardCacheInfo
{
    public DateTime? LastUpdatedAt { get; set; }
    public DateTime? NextUpdateAt { get; set; }
    public int CacheDurationMinutes { get; set; }
    public bool IsProcessing { get; set; }
}

public sealed class AdminUserKpis
{
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int SuspendedUsers { get; set; }
    public int EmailVerifiedUsers { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersThisWeek { get; set; }
    public int NewUsersThisMonth { get; set; }
}

public sealed class AdminMerchantKpis
{
    public int TotalMerchants { get; set; }
    public int ActiveMerchants { get; set; }
    public int DraftMerchants { get; set; }
    public int SuspendedMerchants { get; set; }
    public int PendingKycMerchants { get; set; }
    public int ApprovedKycMerchants { get; set; }
    public int RejectedKycMerchants { get; set; }
    public int NewMerchantsThisMonth { get; set; }
}

public sealed class AdminFinancialKpis
{
    public long TotalVolume { get; set; }
    public long TotalFees { get; set; }
    public long TotalAcquirerFees { get; set; }
    public long TotalNetRevenue { get; set; }
    public long VolumeToday { get; set; }
    public long FeesToday { get; set; }
    public long AcquirerFeesToday { get; set; }
    public long NetRevenueToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long FeesThisWeek { get; set; }
    public long AcquirerFeesThisWeek { get; set; }
    public long NetRevenueThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
    public long FeesThisMonth { get; set; }
    public long AcquirerFeesThisMonth { get; set; }
    public long NetRevenueThisMonth { get; set; }
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int PendingTransactions { get; set; }
    public decimal ApprovalRate { get; set; }
    public decimal FailedRate { get; set; }
    public decimal NetMarginPercentage { get; set; }
    public int TotalPayouts { get; set; }
    public long TotalPayoutAmount { get; set; }
    public long TotalPayoutFees { get; set; }
    public long TotalPayoutAcquirerFees { get; set; }
}

public sealed class AdminDashboardPeriodInfo
{
    public string Period { get; set; } = "7d";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Label { get; set; } = "Ultimos 7 dias";
}

public sealed class AdminDashboardGrowthKpis
{
    public decimal? VolumeGrowth { get; set; }
    public decimal? TotalFeesGrowth { get; set; }
    public decimal? TotalAcquirerFeesGrowth { get; set; }
    public decimal? NetRevenueGrowth { get; set; }
    public decimal? NetMarginGrowth { get; set; }
    public decimal? TransactionsGrowth { get; set; }
    public decimal? ApprovalRateGrowth { get; set; }
    public decimal? FailedRateGrowth { get; set; }
    public decimal? PayoutAmountGrowth { get; set; }
    public decimal? PayoutsGrowth { get; set; }
    public decimal? UsersGrowth { get; set; }
    public decimal? MerchantsGrowth { get; set; }
    public decimal? ActiveUsersGrowth { get; set; }
    public decimal? ActiveMerchantsGrowth { get; set; }
    public decimal? PendingKycGrowth { get; set; }
    public decimal? NewUsersGrowth { get; set; }
    public decimal? NewMerchantsGrowth { get; set; }
    public decimal? RegistrationsGrowth { get; set; }
    public string? GrowthComparisonLabel { get; set; }
}

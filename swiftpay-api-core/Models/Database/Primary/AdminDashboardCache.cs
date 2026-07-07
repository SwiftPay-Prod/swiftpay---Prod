using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class AdminDashboardCache : BaseEntity
{
    public Guid Id { get; set; }
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    // User KPIs
    public int TotalUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
    public int SuspendedUsers { get; set; }
    public int EmailVerifiedUsers { get; set; }
    public int NewUsersToday { get; set; }
    public int NewUsersThisWeek { get; set; }
    public int NewUsersThisMonth { get; set; }

    // Merchant KPIs
    public int TotalMerchants { get; set; }
    public int ActiveMerchants { get; set; }
    public int DraftMerchants { get; set; }
    public int SuspendedMerchants { get; set; }
    public int PendingKycMerchants { get; set; }
    public int ApprovedKycMerchants { get; set; }
    public int RejectedKycMerchants { get; set; }
    public int NewMerchantsThisMonth { get; set; }

    // Financial KPIs
    public long TotalVolume { get; set; }
    public long TotalFees { get; set; }
    public long TotalAcquirerFees { get; set; }
    public long VolumeToday { get; set; }
    public long FeesToday { get; set; }
    public long AcquirerFeesToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long FeesThisWeek { get; set; }
    public long AcquirerFeesThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
    public long FeesThisMonth { get; set; }
    public long AcquirerFeesThisMonth { get; set; }
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int PendingTransactions { get; set; }
    public decimal ApprovalRate { get; set; }
    public int TotalPayouts { get; set; }
    public long TotalPayoutAmount { get; set; }
    public long PayoutFeesTotal { get; set; }
    public long PayoutAcquirerFeesTotal { get; set; }
    public long PayoutFeesToday { get; set; }
    public long PayoutAcquirerFeesToday { get; set; }
    public long PayoutFeesThisWeek { get; set; }
    public long PayoutAcquirerFeesThisWeek { get; set; }
    public long PayoutFeesThisMonth { get; set; }
    public long PayoutAcquirerFeesThisMonth { get; set; }

    // Charts (stored as JSON)
    public string VolumeChartJson { get; set; } = "[]";
    public string RegistrationChartJson { get; set; } = "[]";

    // Cache metadata
    public DateTime CalculatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    // Processing control
    public bool IsProcessing { get; set; } = false;
    public DateTime? NextProcessAt { get; set; }
}

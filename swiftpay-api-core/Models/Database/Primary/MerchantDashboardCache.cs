using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class MerchantDashboardCache : BaseEntity
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    // KPIs
    public long TotalVolume { get; set; }
    public long TotalFees { get; set; }
    public long TotalPayouts { get; set; }
    public decimal ApprovalRate { get; set; }
    public int ChargebackCount { get; set; }
    public decimal ChargebackRate { get; set; }
    public int FailedTransactions { get; set; }
    public decimal FailedRate { get; set; }
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }

    // Period KPIs
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }

    // Growth rates (percentage change vs previous week)
    public decimal? VolumeGrowth { get; set; }
    public decimal? TransactionsGrowth { get; set; }
    public decimal? ApprovalRateGrowth { get; set; }
    public decimal? FailedRateGrowth { get; set; }

    // Chart (stored as JSON)
    public string VolumeChartJson { get; set; } = "[]";
    public string WeeklyChartJson { get; set; } = "[]";

    // Cache metadata
    public DateTime CalculatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }

    // Processing control
    public bool IsProcessing { get; set; } = false;
    public DateTime? NextProcessAt { get; set; }

    // Navigation
    public Merchant Merchant { get; set; } = null!;
}

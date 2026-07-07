namespace swiftpay_api_core.Models.Database;

public class AcquirerDashboardCache : BaseEntity
{
    public Guid Id { get; set; }
    public Guid AcquirerId { get; set; }
    public string Period { get; set; } = "7d";

    // KPIs - Transações
    public int TotalMerchants { get; set; }
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int ExpiredTransactions { get; set; }
    public decimal ApprovalRate { get; set; }

    // KPIs - Volume financeiro
    public long TotalVolume { get; set; }
    public long TotalAcquirerFees { get; set; }
    public long TotalPlatformFees { get; set; }
    public long TotalProfit { get; set; } // TotalPlatformFees - TotalAcquirerFees
    
    // KPIs - Saques
    public int TotalPayouts { get; set; }
    public long TotalPayoutVolume { get; set; }
    public long TotalPayoutAcquirerFees { get; set; }
    public long TotalPayoutPlatformFees { get; set; }
    public long TotalPayoutProfit { get; set; }

    // KPIs - Período
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }

    // Chart (stored as JSON)
    public string VolumeChartJson { get; set; } = "[]";
    public string ProfitChartJson { get; set; } = "[]";

    // Growth rates (percentage change vs previous equivalent period)
    public decimal? VolumeGrowth { get; set; }
    public decimal? TransactionsGrowth { get; set; }
    public decimal? ApprovalRateGrowth { get; set; }
    public decimal? FailedRateGrowth { get; set; }
    public decimal? ProfitGrowth { get; set; }
    public string? GrowthComparisonLabel { get; set; }

    // Cache metadata
    public DateTime CalculatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsProcessing { get; set; }
    public DateTime? NextProcessAt { get; set; }

    // Navigation
    public Acquirer Acquirer { get; set; } = null!;
}

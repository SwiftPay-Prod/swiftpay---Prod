using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Endpoints.Merchants.ReadMerchantDashboard;

namespace swiftpay_api.Endpoints.Admin.Acquirers.ReadAcquirerStats;

public sealed class ReadAcquirerStatsRequest
{
    public Guid AcquirerId { get; set; }
    
    /// <summary>
    /// Período pré-definido: today, yesterday, 7d, 14d, 30d, 90d, this_week, this_month, all, custom
    /// </summary>
    [QueryParam, BindFrom("period")]
    public string? Period { get; set; }

    /// <summary>
    /// Data inicial para período customizado (yyyy-MM-dd)
    /// </summary>
    [QueryParam, BindFrom("startDate")]
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Data final para período customizado (yyyy-MM-dd)
    /// </summary>
    [QueryParam, BindFrom("endDate")]
    public DateOnly? EndDate { get; set; }
}

public sealed class ReadAcquirerStatsRequestValidator : Validator<ReadAcquirerStatsRequest>
{
    public ReadAcquirerStatsRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");
            
        RuleFor(x => x.Period)
            .Must(p => p == null || new[] { "today", "yesterday", "7d", "14d", "30d", "90d", "this_week", "this_month", "all", "custom" }.Contains(p))
            .When(x => x.Period != null)
            .WithMessage("Período inválido. Use: today, yesterday, 7d, 14d, 30d, 90d, this_week, this_month, all ou custom.");

        RuleFor(x => x.StartDate)
            .NotNull()
            .When(x => x.Period == "custom")
            .WithMessage("A data inicial é obrigatória para período customizado.");

        RuleFor(x => x.EndDate)
            .NotNull()
            .When(x => x.Period == "custom")
            .WithMessage("A data final é obrigatória para período customizado.");

        RuleFor(x => x)
            .Must(x => x.Period != "custom" || (x.StartDate.HasValue && x.EndDate.HasValue && x.StartDate.Value <= x.EndDate.Value))
            .WithMessage("A data inicial deve ser menor ou igual à data final.");
    }
}

public sealed class ReadAcquirerStatsResponse : BaseResponse<AdminAcquirerStatsData>;

public sealed class AdminAcquirerStatsData
{
    public Guid AcquirerId { get; set; }
    public AdminAcquirerKpis Kpis { get; set; } = null!;
    public List<AdminAcquirerChartItem> VolumeChart { get; set; } = [];
    public List<AdminAcquirerChartItem> ProfitChart { get; set; } = [];
    public AdminAcquirerStatsCacheInfo CacheInfo { get; set; } = null!;
    public AdminAcquirerPeriodInfo PeriodInfo { get; set; } = null!;
}

public sealed class AdminAcquirerKpis
{
    // Merchants
    public int TotalMerchants { get; set; }
    
    // Transactions
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    public int FailedTransactions { get; set; }
    public int ExpiredTransactions { get; set; }
    public decimal ApprovalRate { get; set; }
    public ApprovalRateLevel ApprovalRateLevel { get; set; }
    public decimal FailureRate { get; set; }
    
    // Volume
    public long TotalVolume { get; set; }
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
    
    // Fees and Profit
    public long TotalAcquirerFees { get; set; }
    public long TotalPlatformFees { get; set; }
    public long TotalProfit { get; set; }
    
    // Payouts
    public int TotalPayouts { get; set; }
    public long TotalPayoutVolume { get; set; }
    public long TotalPayoutAcquirerFees { get; set; }
    public long TotalPayoutPlatformFees { get; set; }
    public long TotalPayoutProfit { get; set; }
    
    // Growth rates (percentage change vs previous equivalent period)
    public decimal? VolumeGrowth { get; set; }
    public decimal? TransactionsGrowth { get; set; }
    public decimal? ApprovalRateGrowth { get; set; }
    public decimal? FailedRateGrowth { get; set; }
    public decimal? ProfitGrowth { get; set; }
    
    /// <summary>
    /// Label describing the growth comparison period (e.g., "vs. ontem", "vs. últimos 7 dias")
    /// </summary>
    public string? GrowthComparisonLabel { get; set; }
}

public sealed class AdminAcquirerChartItem
{
    public string Date { get; set; } = null!;
    public long Value { get; set; }
}

public sealed class AdminAcquirerStatsCacheInfo
{
    public bool IsFromCache { get; set; }
    public bool IsProcessing { get; set; }
    public DateTime? CalculatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int CacheDurationMinutes { get; set; }
}

public sealed class AdminAcquirerPeriodInfo
{
    public string Period { get; set; } = "7d";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Label { get; set; } = "Últimos 7 dias";
}

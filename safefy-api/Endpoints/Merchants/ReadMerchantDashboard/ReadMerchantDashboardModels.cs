using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Dashboard;

namespace safefy_api.Endpoints.Merchants.ReadMerchantDashboard;

/// <summary>
/// Nível de performance da taxa de aprovação
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ApprovalRateLevel
{
    /// <summary>0–15% - Crítico (vermelho)</summary>
    Critical,
    /// <summary>15–25% - Abaixo do ideal (laranja)</summary>
    BelowAverage,
    /// <summary>25–35% - Dentro da média (amarelo)</summary>
    Average,
    /// <summary>35–50% - Boa performance (azul)</summary>
    Good,
    /// <summary>50%+ - Alta performance (verde)</summary>
    Excellent
}

public sealed class ReadMerchantDashboardRequest
{
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Período pré-definido: today, yesterday, 7d, 14d, 30d, 90d, this_week, this_month, all
    /// </summary>
    [QueryParam, BindFrom("period")]
    public string? Period { get; set; }

    /// <summary>
    /// Data de início (formato: yyyy-MM-dd)
    /// </summary>
    [QueryParam, BindFrom("startDate")]
    public DateOnly? StartDate { get; set; }

    /// <summary>
    /// Data de fim (formato: yyyy-MM-dd)
    /// </summary>
    [QueryParam, BindFrom("endDate")]
    public DateOnly? EndDate { get; set; }
}

public sealed class ReadMerchantDashboardValidator : Validator<ReadMerchantDashboardRequest>
{
    public ReadMerchantDashboardValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Period)
            .Must(p => p == null || new[] { "today", "yesterday", "7d", "14d", "30d", "90d", "this_week", "this_month", "all" }.Contains(p))
            .When(x => x.Period != null)
            .WithMessage("Período inválido. Use: today, yesterday, 7d, 14d, 30d, 90d, this_week, this_month ou all.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual à data inicial.");
    }
}

public sealed class ReadMerchantDashboardResponse : BaseResponse<ReadMerchantDashboardData>;

public sealed class ReadMerchantDashboardData
{
    public MerchantKpiData Kpis { get; set; } = null!;
    public MerchantBalanceData Balance { get; set; } = null!;
    public IEnumerable<MerchantDailyVolumeData> VolumeChart { get; set; } = [];
    public IEnumerable<MerchantWeeklyVolumeData> WeeklyChart { get; set; } = [];
    public DashboardCacheInfo CacheInfo { get; set; } = null!;
    public DashboardPeriodInfo PeriodInfo { get; set; } = null!;
}

public sealed class MerchantBalanceData
{
    public string Currency { get; set; } = "BRL";
    public long Available { get; set; }
    public long Pending { get; set; }
    public long Reserved { get; set; }
    public long Total { get; set; }
}

public sealed class DashboardCacheInfo
{
    public DateTime? LastUpdatedAt { get; set; }
    public DateTime? NextUpdateAt { get; set; }
    public int CacheDurationMinutes { get; set; }
    public bool IsProcessing { get; set; }
}

public sealed class DashboardPeriodInfo
{
    public string Period { get; set; } = "7d";
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Label { get; set; } = "Últimos 7 dias";
}

public sealed class MerchantKpiData
{
    /// <summary>
    /// Volume bruto total acumulado (nao filtrado por periodo).
    /// </summary>
    public long TotalSales { get; set; }

    public long TotalVolume { get; set; }
    public long TotalFees { get; set; }
    public long TotalNetVolume { get; set; }
    public long TotalPayouts { get; set; }
    public long PendingPayouts { get; set; }
    public long RefundedAmount { get; set; }
    public int RefundedTransactions { get; set; }
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
    public decimal ApprovalRate { get; set; }
    public ApprovalRateLevel ApprovalRateLevel { get; set; }
    public int ChargebackCount { get; set; }
    public decimal ChargebackRate { get; set; }
    public int FailedTransactions { get; set; }
    public decimal FailedRate { get; set; }
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    
    // Growth rates (percentage change vs previous equivalent period)
    public decimal? VolumeGrowth { get; set; }
    public decimal? TransactionsGrowth { get; set; }
    public decimal? ApprovalRateGrowth { get; set; }
    public decimal? FailedRateGrowth { get; set; }
    
    /// <summary>
    /// Label describing the growth comparison period (e.g., "vs. ontem", "vs. últimos 7 dias")
    /// </summary>
    public string? GrowthComparisonLabel { get; set; }

    /// <summary>
    /// Calcula o nível de performance baseado na taxa de aprovação
    /// </summary>
    public static ApprovalRateLevel GetApprovalRateLevel(decimal approvalRate) => approvalRate switch
    {
        >= 50 => ApprovalRateLevel.Excellent,
        >= 35 => ApprovalRateLevel.Good,
        >= 25 => ApprovalRateLevel.Average,
        >= 15 => ApprovalRateLevel.BelowAverage,
        _ => ApprovalRateLevel.Critical
    };
}

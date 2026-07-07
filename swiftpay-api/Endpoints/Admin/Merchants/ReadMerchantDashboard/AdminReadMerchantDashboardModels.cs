using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Dashboard;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadMerchantDashboard;

public sealed class AdminReadMerchantDashboardRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class AdminReadMerchantDashboardValidator : Validator<AdminReadMerchantDashboardRequest>
{
    public AdminReadMerchantDashboardValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class AdminReadMerchantDashboardResponse : BaseResponse<AdminReadMerchantDashboardData>;

public sealed class AdminReadMerchantDashboardData
{
    public AdminMerchantKpiData Kpis { get; set; } = null!;
    public AdminMerchantBalanceData Balance { get; set; } = null!;
    public IEnumerable<AdminMerchantDailyVolumeData> VolumeChart { get; set; } = [];
    public AdminMerchantDashboardCacheInfo CacheInfo { get; set; } = null!;
}

public sealed class AdminMerchantKpiData
{
    public long TotalVolume { get; set; }
    public long TotalFees { get; set; }
    public decimal ApprovalRate { get; set; }
    public int ChargebackCount { get; set; }
    public decimal ChargebackRate { get; set; }
    public int FailedTransactions { get; set; }
    public decimal FailedRate { get; set; }
    public int TotalTransactions { get; set; }
    public int CompletedTransactions { get; set; }
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
}

public sealed class AdminMerchantBalanceData
{
    public string Currency { get; set; } = "BRL";
    public long Available { get; set; }
    public long Pending { get; set; }
    public long Reserved { get; set; }
    public long Total { get; set; }
}

public sealed class AdminMerchantDashboardCacheInfo
{
    public DateTime? LastUpdatedAt { get; set; }
    public DateTime? NextUpdateAt { get; set; }
    public int CacheDurationMinutes { get; set; }
    public bool IsProcessing { get; set; }
}

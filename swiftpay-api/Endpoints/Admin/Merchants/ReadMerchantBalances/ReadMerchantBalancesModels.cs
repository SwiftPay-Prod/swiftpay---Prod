using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadMerchantBalances;

public sealed class ReadMerchantBalancesRequest
{
    public Guid Id { get; set; }
}

public sealed class ReadMerchantBalancesResponse : BaseResponse<AdminMerchantBalancesData>;

public sealed class AdminMerchantBalancesData
{
    public List<AdminMerchantAcquirerBucket> Acquirers { get; set; } = [];
    public AdminMerchantBalanceTotals Totals { get; set; } = null!;
}

public sealed class AdminMerchantAcquirerBucket
{
    public Guid? MerchantAcquirerId { get; set; }
    public string AcquirerName { get; set; } = string.Empty;
    public string? AcquirerDisplayName { get; set; }
    public string? AcquirerCode { get; set; }
    public string? AcquirerLogoUrl { get; set; }
    public bool IsActive { get; set; }
    public long Available { get; set; }
    public long Pending { get; set; }
    public long Blocked { get; set; }
    public long Reserved { get; set; }
    public long PayoutsOut { get; set; }
    public long TotalIn { get; set; }
}

public sealed class AdminMerchantBalanceTotals
{
    public long LifetimeVolume { get; set; }
    public long LifetimePayouts { get; set; }
    public long LifetimeRefunds { get; set; }
    public long LifetimeFeesPaid { get; set; }
}

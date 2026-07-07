namespace swiftpay_api_core.Models.Ledger;

public class MerchantBalanceInfo
{
    public Guid MerchantId { get; set; }
    public string Currency { get; set; } = "BRL";
    public long Available { get; set; }
    public long WithdrawNowAvailable { get; set; }
    public bool RequiresFullWithdrawalNow { get; set; }
    public long Pending { get; set; }
    public long Reserved { get; set; }
    public long Blocked { get; set; }
    public long Total { get; set; }
    public long LifetimeVolume { get; set; }
    public long LifetimePayouts { get; set; }
    public long LifetimeRefunds { get; set; }
    public long LifetimeFeesPaid { get; set; }
    public long VolumeToday { get; set; }
    public long VolumeThisWeek { get; set; }
    public long VolumeThisMonth { get; set; }
    public List<LedgerEntryInfo> LastTransactions { get; set; } = [];
    public List<MerchantAcquirerBucketBalance> AcquirerBucketBalances { get; set; } = [];
    public DateTime UpdatedAt { get; set; }
}

public class MerchantAcquirerBucketBalance
{
    public Guid? MerchantAcquirerId { get; set; }
    public long Balance { get; set; }
}

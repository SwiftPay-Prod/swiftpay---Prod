using safefy_api.Endpoints.Merchants.Balance;
using safefy_api_core.Models.Ledger;

namespace safefy_api.Mappers;

public static class BalanceMapper
{
    public static ReadBalanceData ToData(MerchantBalanceInfo balanceInfo) => new()
    {
        Currency = balanceInfo.Currency,
        Balance = ToBalanceInfo(balanceInfo),
        Totals = ToTotalsInfo(balanceInfo),
        Period = ToPeriodInfo(balanceInfo),
        LastTransactions = balanceInfo.LastTransactions.Select(ToLastTransactionInfo).ToList(),
        UpdatedAt = balanceInfo.UpdatedAt
    };

    public static BalanceInfo ToBalanceInfo(MerchantBalanceInfo balanceInfo) => new()
    {
        Available = balanceInfo.Available,
        WithdrawNowAvailable = balanceInfo.WithdrawNowAvailable,
        RequiresFullWithdrawalNow = balanceInfo.RequiresFullWithdrawalNow,
        Pending = balanceInfo.Pending,
        Reserved = balanceInfo.Reserved,
        Total = balanceInfo.Total,
        AcquirerBucketBalances = balanceInfo.AcquirerBucketBalances
            .Select(b => new AcquirerBucketBalanceInfo
            {
                MerchantAcquirerId = b.MerchantAcquirerId,
                Balance = b.Balance
            })
            .ToList()
    };

    public static TotalsInfo ToTotalsInfo(MerchantBalanceInfo balanceInfo) => new()
    {
        LifetimeVolume = balanceInfo.LifetimeVolume,
        LifetimePayouts = balanceInfo.LifetimePayouts,
        LifetimeRefunds = balanceInfo.LifetimeRefunds,
        LifetimeFeesPaid = balanceInfo.LifetimeFeesPaid
    };

    public static PeriodInfo ToPeriodInfo(MerchantBalanceInfo balanceInfo) => new()
    {
        VolumeToday = balanceInfo.VolumeToday,
        VolumeThisWeek = balanceInfo.VolumeThisWeek,
        VolumeThisMonth = balanceInfo.VolumeThisMonth
    };

    public static LastTransactionInfo ToLastTransactionInfo(LedgerEntryInfo transaction) => new()
    {
        Id = transaction.Id,
        Type = transaction.Type,
        Amount = transaction.Amount,
        Description = transaction.Description,
        CreatedAt = transaction.CreatedAt
    };
}

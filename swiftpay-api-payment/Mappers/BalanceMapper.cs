using swiftpay_api_core.Models.Ledger;
using swiftpay_api_payment.Endpoints.Balance.Get;

namespace swiftpay_api_payment.Mappers;

public static class BalanceMapper
{
    public static BalanceData ToData(MerchantBalanceInfo balanceInfo)
    {
        var availableNow = balanceInfo.WithdrawNowAvailable;

        return new BalanceData
        {
            Currency = balanceInfo.Currency,
            Balance = new BalanceInfo
            {
                Available = availableNow,
                WithdrawNowAvailable = availableNow,
                RequiresFullWithdrawalNow = balanceInfo.RequiresFullWithdrawalNow,
                Pending = balanceInfo.Pending,
                Reserved = balanceInfo.Reserved,
                Total = availableNow + balanceInfo.Pending + balanceInfo.Reserved
            },
            Totals = new TotalsInfo
            {
                LifetimeVolume = balanceInfo.LifetimeVolume,
                LifetimePayouts = balanceInfo.LifetimePayouts,
                LifetimeRefunds = balanceInfo.LifetimeRefunds
            },
            Period = new PeriodInfo
            {
                VolumeToday = balanceInfo.VolumeToday,
                VolumeThisWeek = balanceInfo.VolumeThisWeek,
                VolumeThisMonth = balanceInfo.VolumeThisMonth
            },
            UpdatedAt = balanceInfo.UpdatedAt
        };
    }
}

namespace safefy_api_core.Models.Calculation;

public sealed class AcquirerBalanceSnapshot
{
    public long SettlementBalance { get; init; }
    public long PayoutsOutBalance { get; init; }
    public long GrossBalance { get; init; }
    public long MerchantBalance { get; init; }
    public long MerchantAvailableBalance { get; init; }
}

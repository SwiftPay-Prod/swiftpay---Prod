namespace safefy_api_core.Models.Calculation;

public sealed class PlatformExpectedBalances
{
    public long TotalAvailableForWithdrawal { get; init; }
    public long ExpectedBlocked { get; init; }
    public long ExpectedPayoutsOut { get; init; }

    public long TotalPlatformFeesFromPayments { get; init; }
    public long TotalAcquirerFeesFromPayments { get; init; }
    public long TotalProfitFeesFromPayments { get; init; }
    public long TotalAutoSplitProfit { get; init; }

    public long TotalPlatformFeesFromPayouts { get; init; }
    public long TotalAcquirerFeesFromPayouts { get; init; }
    public long TotalProfitFeesFromPayouts { get; init; }

    public long PartiallyRefundedRemainingProfit { get; init; }

    public long TotalProcessingPayoutAmount { get; init; }
    public long TotalCompletedPayoutAmount { get; init; }
    public long TotalCompletedPayoutNetAmount { get; init; }
    public long TotalAcquirerFeesFromPlatformPayouts { get; init; }

    public int CompletedPaymentsCount { get; init; }
    public int CompletedPayoutsCount { get; init; }
    public int ProcessingPayoutItemsCount { get; init; }
    public int CompletedPayoutItemsCount { get; init; }
}

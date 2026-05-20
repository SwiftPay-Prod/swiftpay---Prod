using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Utils;

public record TransactionFeeResult
{
    public long PlatformFee { get; init; }
    public long AcquirerFee { get; init; }
    public long NetAmount { get; init; }
    public long AcquirerNetAmount { get; init; }
}

public record PayoutFeeResult
{
    public long PlatformFee { get; init; }
    public long AcquirerFee { get; init; }
    public long NetAmount { get; init; }
}

public static class FeeCalculator
{
    public static long Calculate(long amount, FeeChargeMode mode, long fixedFee, int percentageBasisPoints)
    {
        return mode switch
        {
            FeeChargeMode.FixedOnly => fixedFee,
            FeeChargeMode.PercentageOnly => CalculatePercentage(amount, percentageBasisPoints),
            FeeChargeMode.FixedAndPercentage => fixedFee + CalculatePercentage(amount, percentageBasisPoints),
            _ => fixedFee
        };
    }

    public static long CalculateNetAmount(long amount, long platformFee) => amount - platformFee;

    public static long CalculateNetAmount(long amount, params long[] fees)
    {
        if (fees.Length == 0)
            return amount;

        var totalFees = 0L;
        foreach (var fee in fees)
            totalFees += fee;

        return amount - totalFees;
    }

    public static long CalculateAcquirerNetAmount(long amount, long acquirerFee) => amount - acquirerFee;

    public static TransactionFeeResult CalculateTransactionFees(
        long amount,
        FeeChargeMode platformFeeMode,
        long platformFixedFee,
        int platformPercentageBasisPoints,
        FeeChargeMode acquirerFeeMode,
        long acquirerFixedFee,
        int acquirerPercentageBasisPoints)
    {
        var platformFee = Calculate(amount, platformFeeMode, platformFixedFee, platformPercentageBasisPoints);
        var acquirerFee = Calculate(amount, acquirerFeeMode, acquirerFixedFee, acquirerPercentageBasisPoints);

        return new TransactionFeeResult
        {
            PlatformFee = platformFee,
            AcquirerFee = acquirerFee,
            NetAmount = CalculateNetAmount(amount, platformFee),
            AcquirerNetAmount = CalculateAcquirerNetAmount(amount, acquirerFee)
        };
    }

    public static PayoutFeeResult CalculatePayoutFees(
        long amount,
        FeeChargeMode platformFeeMode,
        long platformFixedFee,
        int platformPercentageBasisPoints,
        FeeChargeMode acquirerFeeMode,
        long acquirerFixedFee,
        int acquirerPercentageBasisPoints)
    {
        var platformFee = Calculate(amount, platformFeeMode, platformFixedFee, platformPercentageBasisPoints);
        var acquirerFee = Calculate(amount, acquirerFeeMode, acquirerFixedFee, acquirerPercentageBasisPoints);

        return new PayoutFeeResult
        {
            PlatformFee = platformFee,
            AcquirerFee = acquirerFee,
            NetAmount = CalculateNetAmount(amount, platformFee)
        };
    }

    public static long CalculateMaxNetForWithdrawal(long availableBalance, FeeChargeMode mode, long fixedFee, int percentageBasisPoints)
    {
        return mode switch
        {
            FeeChargeMode.FixedOnly => Math.Max(0, availableBalance - fixedFee),
            FeeChargeMode.PercentageOnly => (long)Math.Floor(availableBalance * 10000m / (10000 + percentageBasisPoints)),
            FeeChargeMode.FixedAndPercentage =>
                (long)Math.Floor(Math.Max(0, availableBalance - fixedFee) * 10000m / (10000 + percentageBasisPoints)),
            _ => availableBalance
        };
    }

    public static long CalculatePayoutAmountToSend(long netAmount, long acquirerFee, PayoutFeeHandling feeHandling)
    {
        return feeHandling switch
        {
            PayoutFeeHandling.FeeDeductedFromTransfer => netAmount + acquirerFee,
            PayoutFeeHandling.FeeAddedToDebit => netAmount,
            _ => netAmount
        };
    }

    public static long CalculatePlatformProfit(long platformFee, long acquirerFee)
        => platformFee - acquirerFee;

    public static long CalculateReferralCommission(long amount, int basisPoints)
        => (long)Math.Floor(amount * basisPoints / 10000m);

    private static long CalculatePercentage(long amount, int basisPoints)
    {
        return (long)Math.Ceiling(amount * basisPoints / 10000m);
    }
}

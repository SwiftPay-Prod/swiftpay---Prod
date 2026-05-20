using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api_payment.Services.Transactions;

internal static class CheckoutTemplateFeeCalculator
{
    public static long Calculate(
        long amount,
        FeeChargeMode? feeMode,
        long feeFixed,
        int feePercentage)
    {
        var effectiveMode = ResolveEffectiveFeeMode(feeMode, feeFixed, feePercentage);
        if (!effectiveMode.HasValue)
        {
            return 0;
        }

        return FeeCalculator.Calculate(amount, effectiveMode.Value, feeFixed, feePercentage);
    }

    private static FeeChargeMode? ResolveEffectiveFeeMode(
        FeeChargeMode? feeMode,
        long feeFixed,
        int feePercentage)
    {
        if (feeMode.HasValue)
        {
            return feeMode.Value;
        }

        var hasFixed = feeFixed > 0;
        var hasPercentage = feePercentage > 0;

        return (hasFixed, hasPercentage) switch
        {
            (true, true) => FeeChargeMode.FixedAndPercentage,
            (true, false) => FeeChargeMode.FixedOnly,
            (false, true) => FeeChargeMode.PercentageOnly,
            _ => null
        };
    }
}

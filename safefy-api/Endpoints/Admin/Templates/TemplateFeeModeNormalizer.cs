using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Templates;

internal static class TemplateFeeModeNormalizer
{
    public static void Normalize(CheckoutTemplate template)
    {
        var (feeFixed, feePercentage) = Normalize(template.FeeMode, template.FeeFixed, template.FeePercentage);
        template.FeeFixed = feeFixed;
        template.FeePercentage = feePercentage;
    }

    public static (long FeeFixed, int FeePercentage) Normalize(
        FeeChargeMode? feeMode,
        long feeFixed,
        int feePercentage)
    {
        return feeMode switch
        {
            null => (0, 0),
            FeeChargeMode.FixedOnly => (feeFixed, 0),
            FeeChargeMode.PercentageOnly => (0, feePercentage),
            FeeChargeMode.FixedAndPercentage => (feeFixed, feePercentage),
            _ => (feeFixed, feePercentage)
        };
    }
}
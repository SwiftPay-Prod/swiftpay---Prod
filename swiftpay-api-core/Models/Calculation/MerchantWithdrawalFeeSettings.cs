using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Calculation;

public sealed record MerchantWithdrawalFeeSettings(
    FeeChargeMode FeeMode,
    long FeeFixed,
    int FeePercentage)
{
    public static MerchantWithdrawalFeeSettings Resolve(
        MerchantSettings? merchantSettings,
        PlatformSettings platformSettings)
    {
        return new(
            merchantSettings?.WithdrawalFeeMode ?? platformSettings.WithdrawalFeeMode,
            merchantSettings?.WithdrawalFeeFixed ?? platformSettings.WithdrawalFeeFixed,
            merchantSettings?.WithdrawalFeePercentage ?? platformSettings.WithdrawalFeePercentage);
    }
}

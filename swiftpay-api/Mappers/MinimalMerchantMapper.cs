using swiftpay_api.Endpoints.Merchants.ReadListMerchants;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Extensions;

namespace swiftpay_api.Mappers;

public static class MinimalMerchantMapper
{
    public static MinimalMerchant ToData(Merchant merchant, long? availableBalance = null, PlatformSettings? platformSettings = null) => new()
    {
        Id = merchant.Id,
        Name = merchant.Name,
        Email = merchant.Email,
        Document = merchant.MerchantKyc?.DocumentNumber,
        Status = merchant.Status,
        KycStatus = merchant.KycStatus,
        OnboardingStep = merchant.OnboardingStep,
        CreatedAt = merchant.CreatedAt,
        OnboardingCompletedAt = merchant.OnboardingCompletedAt,
        AvailableBalance = availableBalance,
        Fees = MapFees(merchant.MerchantSettings, platformSettings)
    };

    private static MinimalMerchantFees? MapFees(MerchantSettings? settings, PlatformSettings? platformSettings)
    {
        if (platformSettings == null) return null;

        return new MinimalMerchantFees
        {
            PixApiFeeMode = settings?.PixApiFeeMode ?? platformSettings.PixApiFeeMode,
            PixApiFeeFixed = settings?.PixApiFeeFixed ?? platformSettings.PixApiFeeFixed,
            PixApiFeePercentage = settings?.PixApiFeePercentage ?? platformSettings.PixApiFeePercentage,
            PixCheckoutFeeMode = settings?.PixCheckoutFeeMode ?? platformSettings.PixCheckoutFeeMode,
            PixCheckoutFeeFixed = settings?.PixCheckoutFeeFixed ?? platformSettings.PixCheckoutFeeFixed,
            PixCheckoutFeePercentage = settings?.PixCheckoutFeePercentage ?? platformSettings.PixCheckoutFeePercentage,
            WithdrawalFeeMode = settings?.WithdrawalFeeMode ?? platformSettings.WithdrawalFeeMode,
            WithdrawalFeeFixed = settings?.WithdrawalFeeFixed ?? platformSettings.WithdrawalFeeFixed,
            WithdrawalFeePercentage = settings?.WithdrawalFeePercentage ?? platformSettings.WithdrawalFeePercentage,
            MinWithdrawalAmount = settings?.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount
        };
    }
}

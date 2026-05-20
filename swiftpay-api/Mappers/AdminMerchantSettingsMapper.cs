using System.Text.Json;
using safefy_api.Endpoints.Admin.Merchants.ReadMerchantSettings;
using safefy_api_core.Models.Database;

namespace safefy_api.Mappers;

public static class AdminMerchantSettingsMapper
{
    public static AdminMerchantSettingsData ToData(
        MerchantSettings settings,
        PlatformSettings platformSettings,
        bool selfNominalSwitchEnabled,
        DateTime? nextAutomaticCashoutAttemptAt = null,
        DateTime? nextAutomaticCashoutAttemptAtSandbox = null) => new()
    {
        Id = settings.Id,
        MerchantId = settings.MerchantId,
        PixMinTransactionAmount = settings.PixMinTransactionAmount ?? platformSettings.PixMinTransactionAmount,
        PixMaxTransactionAmount = settings.PixMaxTransactionAmount ?? platformSettings.PixMaxTransactionAmount,
        PixEnabled = settings.PixEnabled ?? platformSettings.PixEnabled,
        IsPixEnabledInherited = !settings.PixEnabled.HasValue,
        PixApiFeeMode = settings.PixApiFeeMode ?? platformSettings.PixApiFeeMode,
        PixApiFeeFixed = settings.PixApiFeeFixed ?? platformSettings.PixApiFeeFixed,
        PixApiFeePercentage = settings.PixApiFeePercentage ?? platformSettings.PixApiFeePercentage,
        PixReservePercentage = settings.PixReservePercentage ?? platformSettings.PixReservePercentage,
        PixReserveCompensationDays = settings.PixReserveCompensationDays ?? platformSettings.PixReserveCompensationDays,
        PixCheckoutFeeMode = settings.PixCheckoutFeeMode ?? platformSettings.PixCheckoutFeeMode,
        PixCheckoutFeeFixed = settings.PixCheckoutFeeFixed ?? platformSettings.PixCheckoutFeeFixed,
        PixCheckoutFeePercentage = settings.PixCheckoutFeePercentage ?? platformSettings.PixCheckoutFeePercentage,
        PixPaymentLinkFeeMode = settings.PixPaymentLinkFeeMode ?? platformSettings.PixPaymentLinkFeeMode,
        PixPaymentLinkFeeFixed = settings.PixPaymentLinkFeeFixed ?? platformSettings.PixPaymentLinkFeeFixed,
        PixPaymentLinkFeePercentage = settings.PixPaymentLinkFeePercentage ?? platformSettings.PixPaymentLinkFeePercentage,
        BoletoMinTransactionAmount = settings.BoletoMinTransactionAmount ?? platformSettings.BoletoMinTransactionAmount,
        BoletoMaxTransactionAmount = settings.BoletoMaxTransactionAmount ?? platformSettings.BoletoMaxTransactionAmount,
        BoletoEnabled = settings.BoletoEnabled ?? platformSettings.BoletoEnabled,
        IsBoletoEnabledInherited = !settings.BoletoEnabled.HasValue,
        CreditCardEnabled = settings.CreditCardEnabled ?? platformSettings.CreditCardEnabled,
        IsCreditCardEnabledInherited = !settings.CreditCardEnabled.HasValue,
        BoletoApiFeeMode = settings.BoletoApiFeeMode ?? platformSettings.BoletoApiFeeMode,
        BoletoApiFeeFixed = settings.BoletoApiFeeFixed ?? platformSettings.BoletoApiFeeFixed,
        BoletoApiFeePercentage = settings.BoletoApiFeePercentage ?? platformSettings.BoletoApiFeePercentage,
        BoletoReservePercentage = settings.BoletoReservePercentage ?? platformSettings.BoletoReservePercentage,
        BoletoReserveCompensationDays = settings.BoletoReserveCompensationDays ?? platformSettings.BoletoReserveCompensationDays,
        CreditCardApiFeeMode = settings.CreditCardApiFeeMode ?? platformSettings.CreditCardApiFeeMode,
        CreditCardApiFeeFixed = settings.CreditCardApiFeeFixed ?? platformSettings.CreditCardApiFeeFixed,
        CreditCardApiFeePercentage = settings.CreditCardApiFeePercentage ?? platformSettings.CreditCardApiFeePercentage,
        CreditCardApiInstallmentFeePercentage = settings.CreditCardApiInstallmentFeePercentage ?? platformSettings.CreditCardApiInstallmentFeePercentage,
        CreditCardCheckoutFeeMode = settings.CreditCardCheckoutFeeMode ?? platformSettings.CreditCardCheckoutFeeMode,
        CreditCardCheckoutFeeFixed = settings.CreditCardCheckoutFeeFixed ?? platformSettings.CreditCardCheckoutFeeFixed,
        CreditCardCheckoutFeePercentage = settings.CreditCardCheckoutFeePercentage ?? platformSettings.CreditCardCheckoutFeePercentage,
        CreditCardCheckoutInstallmentFeePercentage = settings.CreditCardCheckoutInstallmentFeePercentage ?? platformSettings.CreditCardCheckoutInstallmentFeePercentage,
        CreditCardPaymentLinkFeeMode = settings.CreditCardPaymentLinkFeeMode ?? platformSettings.CreditCardPaymentLinkFeeMode,
        CreditCardPaymentLinkFeeFixed = settings.CreditCardPaymentLinkFeeFixed ?? platformSettings.CreditCardPaymentLinkFeeFixed,
        CreditCardPaymentLinkFeePercentage = settings.CreditCardPaymentLinkFeePercentage ?? platformSettings.CreditCardPaymentLinkFeePercentage,
        CreditCardPaymentLinkInstallmentFeePercentage = settings.CreditCardPaymentLinkInstallmentFeePercentage ?? platformSettings.CreditCardPaymentLinkInstallmentFeePercentage,
        CreditCardReservePercentage = settings.CreditCardReservePercentage ?? platformSettings.CreditCardReservePercentage,
        CreditCardReserveCompensationDays = settings.CreditCardReserveCompensationDays ?? platformSettings.CreditCardReserveCompensationDays,
        BoletoCheckoutFeeMode = settings.BoletoCheckoutFeeMode ?? platformSettings.BoletoCheckoutFeeMode,
        BoletoCheckoutFeeFixed = settings.BoletoCheckoutFeeFixed ?? platformSettings.BoletoCheckoutFeeFixed,
        BoletoCheckoutFeePercentage = settings.BoletoCheckoutFeePercentage ?? platformSettings.BoletoCheckoutFeePercentage,
        BoletoPaymentLinkFeeMode = settings.BoletoPaymentLinkFeeMode ?? platformSettings.BoletoPaymentLinkFeeMode,
        BoletoPaymentLinkFeeFixed = settings.BoletoPaymentLinkFeeFixed ?? platformSettings.BoletoPaymentLinkFeeFixed,
        BoletoPaymentLinkFeePercentage = settings.BoletoPaymentLinkFeePercentage ?? platformSettings.BoletoPaymentLinkFeePercentage,
        WithdrawalFeeMode = settings.WithdrawalFeeMode ?? platformSettings.WithdrawalFeeMode,
        WithdrawalFeeFixed = settings.WithdrawalFeeFixed ?? platformSettings.WithdrawalFeeFixed,
        WithdrawalFeePercentage = settings.WithdrawalFeePercentage ?? platformSettings.WithdrawalFeePercentage,
        MinWithdrawalAmount = settings.MinWithdrawalAmount ?? platformSettings.MinWithdrawalAmount,
        WithdrawalEnabled = settings.WithdrawalEnabled ?? platformSettings.WithdrawalEnabled,
        IsWithdrawalEnabledInherited = !settings.WithdrawalEnabled.HasValue,
        WithdrawalApprovalMode = settings.WithdrawalApprovalMode ?? platformSettings.WithdrawalApprovalMode,
        RateLimitPerMinute = settings.RateLimitPerMinute ?? platformSettings.RateLimitPerMinute,
        RateLimitPerHour = settings.RateLimitPerHour ?? platformSettings.RateLimitPerHour,
        RateLimitPerDay = settings.RateLimitPerDay ?? platformSettings.RateLimitPerDay,
        PaymentLinkDomainSelection = ParseMerchantDomainSelection(settings.PaymentLinkDomainSelectionJson),
        IsPaymentLinkDomainSelectionInherited = string.IsNullOrWhiteSpace(settings.PaymentLinkDomainSelectionJson),
        IsAutomaticCashoutEnabled = settings.IsAutomaticCashoutEnabled,
        AutomaticCashoutFrequency = settings.AutomaticCashoutFrequency,
        AutomaticCashoutMinAmount = settings.AutomaticCashoutMinAmount,
        AutomaticCashoutMaxAmount = settings.AutomaticCashoutMaxAmount,
        AutomaticCashoutPayoutAccountId = settings.AutomaticCashoutPayoutAccountId,
        NextAutomaticCashoutAttemptAt = nextAutomaticCashoutAttemptAt,
        SelfNominalSwitchEnabled = selfNominalSwitchEnabled,
        IsSelfNominalSwitchEnabledInherited = true,
        IsAutomaticCashoutEnabledSandbox = settings.IsAutomaticCashoutEnabledSandbox,
        AutomaticCashoutFrequencySandbox = settings.AutomaticCashoutFrequencySandbox,
        AutomaticCashoutMinAmountSandbox = settings.AutomaticCashoutMinAmountSandbox,
        AutomaticCashoutMaxAmountSandbox = settings.AutomaticCashoutMaxAmountSandbox,
        AutomaticCashoutPayoutAccountIdSandbox = settings.AutomaticCashoutPayoutAccountIdSandbox,
        NextAutomaticCashoutAttemptAtSandbox = nextAutomaticCashoutAttemptAtSandbox,
        CreatedAt = settings.CreatedAt,
        UpdatedAt = settings.UpdatedAt
    };

    private static MerchantPaymentLinkDomainSelection? ParseMerchantDomainSelection(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonSerializer.Deserialize<MerchantPaymentLinkDomainSelection>(json);
        }
        catch
        {
            return null;
        }
    }
}

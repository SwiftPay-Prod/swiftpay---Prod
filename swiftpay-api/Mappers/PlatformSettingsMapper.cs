using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api.Endpoints.Admin.Settings.ReadPlatformSettings;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class PlatformSettingsMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static AdminPlatformSettingsData ToData(
        PlatformSettings settings,
        DateTime? nextAutomaticCashoutAttemptAt = null) => new()
    {
        Id = settings.Id,
        PixMinTransactionAmount = settings.PixMinTransactionAmount,
        PixMaxTransactionAmount = settings.PixMaxTransactionAmount,
        PixTimeoutMinutes = settings.PixTimeoutMinutes,
        PixEnabled = settings.PixEnabled,
        PixApiFeeMode = settings.PixApiFeeMode,
        PixApiFeeFixed = settings.PixApiFeeFixed,
        PixApiFeePercentage = settings.PixApiFeePercentage,
        PixReservePercentage = settings.PixReservePercentage,
        PixReserveCompensationDays = settings.PixReserveCompensationDays,
        PixCheckoutFeeMode = settings.PixCheckoutFeeMode,
        PixCheckoutFeeFixed = settings.PixCheckoutFeeFixed,
        PixCheckoutFeePercentage = settings.PixCheckoutFeePercentage,
        PixPaymentLinkFeeMode = settings.PixPaymentLinkFeeMode,
        PixPaymentLinkFeeFixed = settings.PixPaymentLinkFeeFixed,
        PixPaymentLinkFeePercentage = settings.PixPaymentLinkFeePercentage,
        BoletoMinTransactionAmount = settings.BoletoMinTransactionAmount,
        BoletoMaxTransactionAmount = settings.BoletoMaxTransactionAmount,
        BoletoEnabled = settings.BoletoEnabled,
        CreditCardEnabled = settings.CreditCardEnabled,
        BoletoApiFeeMode = settings.BoletoApiFeeMode,
        BoletoApiFeeFixed = settings.BoletoApiFeeFixed,
        BoletoApiFeePercentage = settings.BoletoApiFeePercentage,
        BoletoReservePercentage = settings.BoletoReservePercentage,
        BoletoReserveCompensationDays = settings.BoletoReserveCompensationDays,
        CreditCardApiFeeMode = settings.CreditCardApiFeeMode,
        CreditCardApiFeeFixed = settings.CreditCardApiFeeFixed,
        CreditCardApiFeePercentage = settings.CreditCardApiFeePercentage,
        CreditCardApiInstallmentFeePercentage = settings.CreditCardApiInstallmentFeePercentage,
        CreditCardCheckoutFeeMode = settings.CreditCardCheckoutFeeMode,
        CreditCardCheckoutFeeFixed = settings.CreditCardCheckoutFeeFixed,
        CreditCardCheckoutFeePercentage = settings.CreditCardCheckoutFeePercentage,
        CreditCardCheckoutInstallmentFeePercentage = settings.CreditCardCheckoutInstallmentFeePercentage,
        CreditCardPaymentLinkFeeMode = settings.CreditCardPaymentLinkFeeMode,
        CreditCardPaymentLinkFeeFixed = settings.CreditCardPaymentLinkFeeFixed,
        CreditCardPaymentLinkFeePercentage = settings.CreditCardPaymentLinkFeePercentage,
        CreditCardPaymentLinkInstallmentFeePercentage = settings.CreditCardPaymentLinkInstallmentFeePercentage,
        CreditCardReservePercentage = settings.CreditCardReservePercentage,
        CreditCardReserveCompensationDays = settings.CreditCardReserveCompensationDays,
        BoletoCheckoutFeeMode = settings.BoletoCheckoutFeeMode,
        BoletoCheckoutFeeFixed = settings.BoletoCheckoutFeeFixed,
        BoletoCheckoutFeePercentage = settings.BoletoCheckoutFeePercentage,
        BoletoPaymentLinkFeeMode = settings.BoletoPaymentLinkFeeMode,
        BoletoPaymentLinkFeeFixed = settings.BoletoPaymentLinkFeeFixed,
        BoletoPaymentLinkFeePercentage = settings.BoletoPaymentLinkFeePercentage,
        PixPaymentLinkBaseUrl = settings.PixPaymentLinkBaseUrl,
        BoletoPaymentLinkBaseUrl = settings.BoletoPaymentLinkBaseUrl,
        CreditCardPaymentLinkBaseUrl = settings.CreditCardPaymentLinkBaseUrl,
        PaymentLinkDomainOptions = ParsePaymentLinkDomainOptions(settings.PaymentLinkDomainOptionsJson),
        WithdrawalFeeMode = settings.WithdrawalFeeMode,
        WithdrawalFeeFixed = settings.WithdrawalFeeFixed,
        WithdrawalFeePercentage = settings.WithdrawalFeePercentage,
        MinWithdrawalAmount = settings.MinWithdrawalAmount,
        WithdrawalEnabled = settings.WithdrawalEnabled,
        SelfNominalSwitchEnabled = settings.SelfNominalSwitchEnabled,
        WithdrawalApprovalMode = settings.WithdrawalApprovalMode,
        RateLimitPerMinute = settings.RateLimitPerMinute,
        RateLimitPerHour = settings.RateLimitPerHour,
        RateLimitPerDay = settings.RateLimitPerDay,
        ReferralDurationMonths = settings.ReferralDurationMonths,
        ReferralCommissionPercentage = settings.ReferralCommissionPercentage,
        ReferralCommissionWithdrawalIntervalValue = settings.ReferralCommissionWithdrawalIntervalValue,
        ReferralCommissionWithdrawalIntervalUnit = settings.ReferralCommissionWithdrawalIntervalUnit,
        ReferralCommissionMinWithdrawalAmount = settings.ReferralCommissionMinWithdrawalAmount,
        ReferralCommissionWithdrawalFeeFixed = settings.ReferralCommissionWithdrawalFeeFixed,
        IsAutomaticCashoutEnabled = settings.IsAutomaticCashoutEnabled,
        AutomaticCashoutFrequency = settings.AutomaticCashoutFrequency,
        AutomaticCashoutMinAmount = settings.AutomaticCashoutMinAmount,
        AutomaticCashoutMaxAmount = settings.AutomaticCashoutMaxAmount,
        AutomaticCashoutPayoutAccountId = settings.AutomaticCashoutPayoutAccountId,
        NextAutomaticCashoutAttemptAt = nextAutomaticCashoutAttemptAt,
        UpdatedAt = settings.UpdatedAt
    };

    private static List<PaymentLinkDomainMethodOptions> ParsePaymentLinkDomainOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<PaymentLinkDomainMethodOptions>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }
}

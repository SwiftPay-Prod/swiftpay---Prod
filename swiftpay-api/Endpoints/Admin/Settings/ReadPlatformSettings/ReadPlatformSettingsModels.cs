using System.Text.Json.Serialization;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Settings.ReadPlatformSettings;

public sealed class ReadPlatformSettingsRequest;

public sealed class ReadPlatformSettingsResponse : BaseResponse<AdminPlatformSettingsData>;

public sealed class AdminPlatformSettingsData
{
    public Guid Id { get; set; }

    // PIX Limits
    public long PixMinTransactionAmount { get; set; }
    public long PixMaxTransactionAmount { get; set; }
    public int PixTimeoutMinutes { get; set; }
    public bool PixEnabled { get; set; }

    // PIX API Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PixApiFeeMode { get; set; }
    public long PixApiFeeFixed { get; set; }
    public int PixApiFeePercentage { get; set; }
    public int PixReservePercentage { get; set; }
    public int PixReserveCompensationDays { get; set; }

    // PIX Checkout Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PixCheckoutFeeMode { get; set; }
    public long PixCheckoutFeeFixed { get; set; }
    public int PixCheckoutFeePercentage { get; set; }

    // PIX Payment Link Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode PixPaymentLinkFeeMode { get; set; }
    public long PixPaymentLinkFeeFixed { get; set; }
    public int PixPaymentLinkFeePercentage { get; set; }

    // BOLETO Limits
    public long BoletoMinTransactionAmount { get; set; }
    public long BoletoMaxTransactionAmount { get; set; }
    public bool BoletoEnabled { get; set; }
    public bool CreditCardEnabled { get; set; }

    // BOLETO API Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode BoletoApiFeeMode { get; set; }
    public long BoletoApiFeeFixed { get; set; }
    public int BoletoApiFeePercentage { get; set; }
    public int BoletoReservePercentage { get; set; }
    public int BoletoReserveCompensationDays { get; set; }

    // CREDIT CARD API Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode CreditCardApiFeeMode { get; set; }
    public long CreditCardApiFeeFixed { get; set; }
    public int CreditCardApiFeePercentage { get; set; }
    public int CreditCardApiInstallmentFeePercentage { get; set; }

    // CREDIT CARD Checkout Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode CreditCardCheckoutFeeMode { get; set; }
    public long CreditCardCheckoutFeeFixed { get; set; }
    public int CreditCardCheckoutFeePercentage { get; set; }
    public int CreditCardCheckoutInstallmentFeePercentage { get; set; }

    // CREDIT CARD Payment Link Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode CreditCardPaymentLinkFeeMode { get; set; }
    public long CreditCardPaymentLinkFeeFixed { get; set; }
    public int CreditCardPaymentLinkFeePercentage { get; set; }
    public int CreditCardPaymentLinkInstallmentFeePercentage { get; set; }

    public int CreditCardReservePercentage { get; set; }
    public int CreditCardReserveCompensationDays { get; set; }

    // BOLETO Checkout Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode BoletoCheckoutFeeMode { get; set; }
    public long BoletoCheckoutFeeFixed { get; set; }
    public int BoletoCheckoutFeePercentage { get; set; }

    // BOLETO Payment Link Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode BoletoPaymentLinkFeeMode { get; set; }
    public long BoletoPaymentLinkFeeFixed { get; set; }
    public int BoletoPaymentLinkFeePercentage { get; set; }

    // Payment/Boleto link domains
    public string PixPaymentLinkBaseUrl { get; set; } = string.Empty;
    public string BoletoPaymentLinkBaseUrl { get; set; } = string.Empty;
    public string CreditCardPaymentLinkBaseUrl { get; set; } = string.Empty;
    public List<PaymentLinkDomainMethodOptions> PaymentLinkDomainOptions { get; set; } = [];

    // Withdrawal Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode WithdrawalFeeMode { get; set; }
    public long WithdrawalFeeFixed { get; set; }
    public int WithdrawalFeePercentage { get; set; }
    public long MinWithdrawalAmount { get; set; }
    public bool WithdrawalEnabled { get; set; }
    public bool SelfNominalSwitchEnabled { get; set; }
    
    // Withdrawal Approval Mode
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public WithdrawalApprovalMode WithdrawalApprovalMode { get; set; }

    // Rate Limiting
    public int RateLimitPerMinute { get; set; }
    public int RateLimitPerHour { get; set; }
    public int RateLimitPerDay { get; set; }

    // Referral Settings
    public int ReferralDurationMonths { get; set; }
    public int ReferralCommissionPercentage { get; set; }
    public int ReferralCommissionWithdrawalIntervalValue { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralWithdrawalIntervalUnit ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long ReferralCommissionMinWithdrawalAmount { get; set; }
    public long ReferralCommissionWithdrawalFeeFixed { get; set; }

    // Automatic Cashout
    public bool IsAutomaticCashoutEnabled { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency AutomaticCashoutFrequency { get; set; }
    public long AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
    public DateTime? NextAutomaticCashoutAttemptAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

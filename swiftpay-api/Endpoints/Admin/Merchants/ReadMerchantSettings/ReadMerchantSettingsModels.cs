using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Merchants.ReadMerchantSettings;

public sealed class ReadMerchantSettingsRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadMerchantSettingsRequestValidator : Validator<ReadMerchantSettingsRequest>
{
    public ReadMerchantSettingsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");
    }
}

public sealed class ReadMerchantSettingsResponse : BaseResponse<AdminMerchantSettingsData>;

public sealed class AdminMerchantSettingsData
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }

    // Pix Limits (null = using platform defaults)
    public long? PixMinTransactionAmount { get; set; }
    public long? PixMaxTransactionAmount { get; set; }
    public bool? PixEnabled { get; set; }
    public bool IsPixEnabledInherited { get; set; }

    // PIX API Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixApiFeeMode { get; set; }
    public long? PixApiFeeFixed { get; set; }
    public int? PixApiFeePercentage { get; set; }
    public int? PixReservePercentage { get; set; }
    public int? PixReserveCompensationDays { get; set; }

    // PIX Checkout Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixCheckoutFeeMode { get; set; }
    public long? PixCheckoutFeeFixed { get; set; }
    public int? PixCheckoutFeePercentage { get; set; }

    // PIX Payment Link Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixPaymentLinkFeeMode { get; set; }
    public long? PixPaymentLinkFeeFixed { get; set; }
    public int? PixPaymentLinkFeePercentage { get; set; }

    // Boleto Limits (null = using platform defaults)
    public long? BoletoMinTransactionAmount { get; set; }
    public long? BoletoMaxTransactionAmount { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool IsBoletoEnabledInherited { get; set; }
    public bool? CreditCardEnabled { get; set; }
    public bool IsCreditCardEnabledInherited { get; set; }

    // BOLETO API Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoApiFeeMode { get; set; }
    public long? BoletoApiFeeFixed { get; set; }
    public int? BoletoApiFeePercentage { get; set; }
    public int? BoletoReservePercentage { get; set; }
    public int? BoletoReserveCompensationDays { get; set; }

    // CREDIT CARD API Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardApiFeeMode { get; set; }
    public long? CreditCardApiFeeFixed { get; set; }
    public int? CreditCardApiFeePercentage { get; set; }
    public int? CreditCardApiInstallmentFeePercentage { get; set; }

    // CREDIT CARD Checkout Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardCheckoutFeeMode { get; set; }
    public long? CreditCardCheckoutFeeFixed { get; set; }
    public int? CreditCardCheckoutFeePercentage { get; set; }
    public int? CreditCardCheckoutInstallmentFeePercentage { get; set; }

    // CREDIT CARD Payment Link Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardPaymentLinkFeeMode { get; set; }
    public long? CreditCardPaymentLinkFeeFixed { get; set; }
    public int? CreditCardPaymentLinkFeePercentage { get; set; }
    public int? CreditCardPaymentLinkInstallmentFeePercentage { get; set; }

    public int? CreditCardReservePercentage { get; set; }
    public int? CreditCardReserveCompensationDays { get; set; }

    // BOLETO Checkout Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoCheckoutFeeMode { get; set; }
    public long? BoletoCheckoutFeeFixed { get; set; }
    public int? BoletoCheckoutFeePercentage { get; set; }

    // BOLETO Payment Link Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoPaymentLinkFeeMode { get; set; }
    public long? BoletoPaymentLinkFeeFixed { get; set; }
    public int? BoletoPaymentLinkFeePercentage { get; set; }

    // Withdrawal Fee (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? WithdrawalFeeMode { get; set; }
    public long? WithdrawalFeeFixed { get; set; }
    public int? WithdrawalFeePercentage { get; set; }
    public long? MinWithdrawalAmount { get; set; }
    public bool? WithdrawalEnabled { get; set; }
    public bool IsWithdrawalEnabledInherited { get; set; }
    
    // Withdrawal Approval (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public WithdrawalApprovalMode? WithdrawalApprovalMode { get; set; }

    // Rate Limiting - Payment API (null = using platform defaults)
    public int? RateLimitPerMinute { get; set; }
    public int? RateLimitPerHour { get; set; }
    public int? RateLimitPerDay { get; set; }

    public MerchantPaymentLinkDomainSelection? PaymentLinkDomainSelection { get; set; }
    public bool IsPaymentLinkDomainSelectionInherited { get; set; }

    // Automatic Cashout
    public bool? IsAutomaticCashoutEnabled { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency? AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
    public DateTime? NextAutomaticCashoutAttemptAt { get; set; }
    public bool SelfNominalSwitchEnabled { get; set; }
    public bool IsSelfNominalSwitchEnabledInherited { get; set; }

    // Automatic Cashout - Sandbox
    public bool IsAutomaticCashoutEnabledSandbox { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency AutomaticCashoutFrequencySandbox { get; set; }
    public long? AutomaticCashoutMinAmountSandbox { get; set; }
    public long? AutomaticCashoutMaxAmountSandbox { get; set; }
    public Guid? AutomaticCashoutPayoutAccountIdSandbox { get; set; }
    public DateTime? NextAutomaticCashoutAttemptAtSandbox { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

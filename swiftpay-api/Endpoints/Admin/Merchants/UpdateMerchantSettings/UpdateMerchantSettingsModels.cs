using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Merchants.UpdateMerchantSettings;

public sealed class UpdateMerchantSettingsRequest
{
    public Guid MerchantId { get; set; }

    // Pix Limits
    public long? PixMinTransactionAmount { get; set; }
    public long? PixMaxTransactionAmount { get; set; }
    public bool? PixEnabled { get; set; }

    // Taxa PIX via API
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixApiFeeMode { get; set; }
    public long? PixApiFeeFixed { get; set; }
    public int? PixApiFeePercentage { get; set; }
    public int? PixReservePercentage { get; set; }
    public int? PixReserveCompensationDays { get; set; }

    // Taxa PIX via Checkout
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixCheckoutFeeMode { get; set; }
    public long? PixCheckoutFeeFixed { get; set; }
    public int? PixCheckoutFeePercentage { get; set; }

    // Taxa PIX via Payment Link
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixPaymentLinkFeeMode { get; set; }
    public long? PixPaymentLinkFeeFixed { get; set; }
    public int? PixPaymentLinkFeePercentage { get; set; }

    // Boleto Limits
    public long? BoletoMinTransactionAmount { get; set; }
    public long? BoletoMaxTransactionAmount { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }

    // Taxa BOLETO via API
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoApiFeeMode { get; set; }
    public long? BoletoApiFeeFixed { get; set; }
    public int? BoletoApiFeePercentage { get; set; }
    public int? BoletoReservePercentage { get; set; }
    public int? BoletoReserveCompensationDays { get; set; }

    // Taxa CARTAO via API
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardApiFeeMode { get; set; }
    public long? CreditCardApiFeeFixed { get; set; }
    public int? CreditCardApiFeePercentage { get; set; }
    public int? CreditCardApiInstallmentFeePercentage { get; set; }

    // Taxa CARTAO via Checkout
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardCheckoutFeeMode { get; set; }
    public long? CreditCardCheckoutFeeFixed { get; set; }
    public int? CreditCardCheckoutFeePercentage { get; set; }
    public int? CreditCardCheckoutInstallmentFeePercentage { get; set; }

    // Taxa CARTAO via Payment Link
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardPaymentLinkFeeMode { get; set; }
    public long? CreditCardPaymentLinkFeeFixed { get; set; }
    public int? CreditCardPaymentLinkFeePercentage { get; set; }
    public int? CreditCardPaymentLinkInstallmentFeePercentage { get; set; }

    public int? CreditCardReservePercentage { get; set; }
    public int? CreditCardReserveCompensationDays { get; set; }

    // Taxa BOLETO via Checkout
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoCheckoutFeeMode { get; set; }
    public long? BoletoCheckoutFeeFixed { get; set; }
    public int? BoletoCheckoutFeePercentage { get; set; }

    // Taxa BOLETO via Payment Link
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoPaymentLinkFeeMode { get; set; }
    public long? BoletoPaymentLinkFeeFixed { get; set; }
    public int? BoletoPaymentLinkFeePercentage { get; set; }

    // Withdrawal Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? WithdrawalFeeMode { get; set; }
    public long? WithdrawalFeeFixed { get; set; }
    public int? WithdrawalFeePercentage { get; set; }
    public long? MinWithdrawalAmount { get; set; }
    public bool? WithdrawalEnabled { get; set; }
    
    // Withdrawal Approval
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public WithdrawalApprovalMode? WithdrawalApprovalMode { get; set; }

    // Rate Limiting (Payment API)
    public int? RateLimitPerMinute { get; set; }
    public int? RateLimitPerHour { get; set; }
    public int? RateLimitPerDay { get; set; }

    public MerchantPaymentLinkDomainSelection? PaymentLinkDomainSelection { get; set; }

    // Automatic Cashout
    public bool? IsAutomaticCashoutEnabled { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency? AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }

    // History tracking
    public string? Reason { get; set; }
}

public sealed class UpdateMerchantSettingsRequestValidator : Validator<UpdateMerchantSettingsRequest>
{
    public UpdateMerchantSettingsRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.PixMinTransactionAmount)
            .GreaterThanOrEqualTo(0).When(x => x.PixMinTransactionAmount.HasValue)
            .WithMessage("PixMinTransactionAmount deve ser maior ou igual a 0");

        RuleFor(x => x.PixMaxTransactionAmount)
            .GreaterThanOrEqualTo(0).When(x => x.PixMaxTransactionAmount.HasValue)
            .WithMessage("PixMaxTransactionAmount deve ser maior ou igual a 0");

        RuleFor(x => x.PixMaxTransactionAmount)
            .GreaterThanOrEqualTo(x => x.PixMinTransactionAmount)
            .When(x => x.PixMaxTransactionAmount.HasValue && x.PixMinTransactionAmount.HasValue)
            .WithMessage("O valor máximo não pode ser menor que o valor mínimo");

        RuleFor(x => x.PixApiFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.PixApiFeeFixed.HasValue)
            .WithMessage("PixApiFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.PixApiFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.PixApiFeePercentage.HasValue)
            .WithMessage("PixApiFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.PixReservePercentage)
            .InclusiveBetween(0, 10000).When(x => x.PixReservePercentage.HasValue)
            .WithMessage("PixReservePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.PixReserveCompensationDays)
            .InclusiveBetween(0, 365).When(x => x.PixReserveCompensationDays.HasValue)
            .WithMessage("PixReserveCompensationDays deve estar entre 0 e 365 dias");

        RuleFor(x => x.PixCheckoutFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.PixCheckoutFeeFixed.HasValue)
            .WithMessage("PixCheckoutFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.PixCheckoutFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.PixCheckoutFeePercentage.HasValue)
            .WithMessage("PixCheckoutFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.PixPaymentLinkFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.PixPaymentLinkFeeFixed.HasValue)
            .WithMessage("PixPaymentLinkFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.PixPaymentLinkFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.PixPaymentLinkFeePercentage.HasValue)
            .WithMessage("PixPaymentLinkFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.BoletoMinTransactionAmount)
            .GreaterThanOrEqualTo(0).When(x => x.BoletoMinTransactionAmount.HasValue)
            .WithMessage("BoletoMinTransactionAmount deve ser maior ou igual a 0");

        RuleFor(x => x.BoletoMaxTransactionAmount)
            .GreaterThanOrEqualTo(0).When(x => x.BoletoMaxTransactionAmount.HasValue)
            .WithMessage("BoletoMaxTransactionAmount deve ser maior ou igual a 0");

        RuleFor(x => x.BoletoMaxTransactionAmount)
            .GreaterThanOrEqualTo(x => x.BoletoMinTransactionAmount)
            .When(x => x.BoletoMaxTransactionAmount.HasValue && x.BoletoMinTransactionAmount.HasValue)
            .WithMessage("O valor máximo do boleto não pode ser menor que o valor mínimo");

        RuleFor(x => x.BoletoApiFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.BoletoApiFeeFixed.HasValue)
            .WithMessage("BoletoApiFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.BoletoApiFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.BoletoApiFeePercentage.HasValue)
            .WithMessage("BoletoApiFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.BoletoReservePercentage)
            .InclusiveBetween(0, 10000).When(x => x.BoletoReservePercentage.HasValue)
            .WithMessage("BoletoReservePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.BoletoReserveCompensationDays)
            .InclusiveBetween(0, 365).When(x => x.BoletoReserveCompensationDays.HasValue)
            .WithMessage("BoletoReserveCompensationDays deve estar entre 0 e 365 dias");

        RuleFor(x => x.CreditCardApiFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.CreditCardApiFeeFixed.HasValue)
            .WithMessage("CreditCardApiFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.CreditCardApiFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardApiFeePercentage.HasValue)
            .WithMessage("CreditCardApiFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardApiInstallmentFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardApiInstallmentFeePercentage.HasValue)
            .WithMessage("CreditCardApiInstallmentFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardCheckoutFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.CreditCardCheckoutFeeFixed.HasValue)
            .WithMessage("CreditCardCheckoutFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.CreditCardCheckoutFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardCheckoutFeePercentage.HasValue)
            .WithMessage("CreditCardCheckoutFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardCheckoutInstallmentFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardCheckoutInstallmentFeePercentage.HasValue)
            .WithMessage("CreditCardCheckoutInstallmentFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardPaymentLinkFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.CreditCardPaymentLinkFeeFixed.HasValue)
            .WithMessage("CreditCardPaymentLinkFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.CreditCardPaymentLinkFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardPaymentLinkFeePercentage.HasValue)
            .WithMessage("CreditCardPaymentLinkFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardPaymentLinkInstallmentFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardPaymentLinkInstallmentFeePercentage.HasValue)
            .WithMessage("CreditCardPaymentLinkInstallmentFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardReservePercentage)
            .InclusiveBetween(0, 10000).When(x => x.CreditCardReservePercentage.HasValue)
            .WithMessage("CreditCardReservePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.CreditCardReserveCompensationDays)
            .InclusiveBetween(0, 365).When(x => x.CreditCardReserveCompensationDays.HasValue)
            .WithMessage("CreditCardReserveCompensationDays deve estar entre 0 e 365 dias");

        RuleFor(x => x.BoletoCheckoutFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.BoletoCheckoutFeeFixed.HasValue)
            .WithMessage("BoletoCheckoutFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.BoletoCheckoutFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.BoletoCheckoutFeePercentage.HasValue)
            .WithMessage("BoletoCheckoutFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.BoletoPaymentLinkFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.BoletoPaymentLinkFeeFixed.HasValue)
            .WithMessage("BoletoPaymentLinkFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.BoletoPaymentLinkFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.BoletoPaymentLinkFeePercentage.HasValue)
            .WithMessage("BoletoPaymentLinkFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.WithdrawalFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.WithdrawalFeeFixed.HasValue)
            .WithMessage("WithdrawalFeeFixed deve ser maior ou igual a 0");

        RuleFor(x => x.WithdrawalFeePercentage)
            .InclusiveBetween(0, 10000).When(x => x.WithdrawalFeePercentage.HasValue)
            .WithMessage("WithdrawalFeePercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.MinWithdrawalAmount)
            .GreaterThanOrEqualTo(0).When(x => x.MinWithdrawalAmount.HasValue)
            .WithMessage("MinWithdrawalAmount deve ser maior ou igual a 0");

        RuleFor(x => x.RateLimitPerMinute)
            .InclusiveBetween(1, 1000).When(x => x.RateLimitPerMinute.HasValue)
            .WithMessage("RateLimitPerMinute deve estar entre 1 e 1000");

        RuleFor(x => x.RateLimitPerHour)
            .InclusiveBetween(1, 10000).When(x => x.RateLimitPerHour.HasValue)
            .WithMessage("RateLimitPerHour deve estar entre 1 e 10000");

        RuleFor(x => x.RateLimitPerDay)
            .InclusiveBetween(1, 100000).When(x => x.RateLimitPerDay.HasValue)
            .WithMessage("RateLimitPerDay deve estar entre 1 e 100000");

        RuleFor(x => x.AutomaticCashoutMinAmount)
            .GreaterThanOrEqualTo(0).When(x => x.AutomaticCashoutMinAmount.HasValue)
            .WithMessage("AutomaticCashoutMinAmount deve ser maior ou igual a 0");

        RuleFor(x => x.AutomaticCashoutMaxAmount)
            .GreaterThanOrEqualTo(0).When(x => x.AutomaticCashoutMaxAmount.HasValue)
            .WithMessage("AutomaticCashoutMaxAmount deve ser maior ou igual a 0");

        RuleFor(x => x.AutomaticCashoutMaxAmount)
            .GreaterThan(x => x.AutomaticCashoutMinAmount)
            .When(x => x.AutomaticCashoutMaxAmount.HasValue && x.AutomaticCashoutMinAmount.HasValue)
            .WithMessage("AutomaticCashoutMaxAmount deve ser maior que AutomaticCashoutMinAmount");

        RuleFor(x => x.AutomaticCashoutPayoutAccountId)
            .NotEmpty()
            .When(x => x.AutomaticCashoutPayoutAccountId.HasValue)
            .WithMessage("AutomaticCashoutPayoutAccountId inválido");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("O motivo deve ter no máximo 500 caracteres");

        RuleFor(x => x.PaymentLinkDomainSelection)
            .Custom((selection, context) =>
            {
                if (selection == null)
                {
                    return;
                }

                ValidateOptionIdLength(selection.PixOptionId, "PaymentLinkDomainSelection.PixOptionId", context);
                ValidateOptionIdLength(selection.BoletoOptionId, "PaymentLinkDomainSelection.BoletoOptionId", context);
                ValidateOptionIdLength(selection.CreditCardOptionId, "PaymentLinkDomainSelection.CreditCardOptionId", context);
            });
    }

    private static void ValidateOptionIdLength(string? optionId, string fieldName, FluentValidation.ValidationContext<UpdateMerchantSettingsRequest> context)
    {
        if (string.IsNullOrWhiteSpace(optionId))
        {
            return;
        }

        if (optionId.Trim().Length > 100)
        {
            context.AddFailure(fieldName, "O identificador da opção de domínio deve ter até 100 caracteres.");
        }
    }
}

public sealed class UpdateMerchantSettingsResponse : BaseResponse<MerchantSettingsData>;

public sealed class MerchantSettingsData
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }

    // Pix Limits (null = using platform defaults)
    public long? PixMinTransactionAmount { get; set; }
    public long? PixMaxTransactionAmount { get; set; }
    public bool? PixEnabled { get; set; }

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
    public bool? CreditCardEnabled { get; set; }
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
    
    // Withdrawal Approval (null = using platform defaults)
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public WithdrawalApprovalMode? WithdrawalApprovalMode { get; set; }

    // Rate Limiting - Payment API (null = using platform defaults)
    public int? RateLimitPerMinute { get; set; }
    public int? RateLimitPerHour { get; set; }
    public int? RateLimitPerDay { get; set; }

    public MerchantPaymentLinkDomainSelection? PaymentLinkDomainSelection { get; set; }

    // Automatic Cashout
    public bool? IsAutomaticCashoutEnabled { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency? AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
    public DateTime UpdatedAt { get; set; }
}

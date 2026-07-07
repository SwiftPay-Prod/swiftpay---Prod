using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Admin.Settings.ReadPlatformSettings;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Settings.UpdatePlatformSettings;

public sealed class UpdatePlatformSettingsRequest
{
    // PIX Limits
    public long? PixMinTransactionAmount { get; set; }
    public long? PixMaxTransactionAmount { get; set; }
    public int? PixTimeoutMinutes { get; set; }
    public bool? PixEnabled { get; set; }

    // PIX API Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixApiFeeMode { get; set; }
    public long? PixApiFeeFixed { get; set; }
    public int? PixApiFeePercentage { get; set; }
    public int? PixReservePercentage { get; set; }
    public int? PixReserveCompensationDays { get; set; }

    // PIX Checkout Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixCheckoutFeeMode { get; set; }
    public long? PixCheckoutFeeFixed { get; set; }
    public int? PixCheckoutFeePercentage { get; set; }

    // PIX Payment Link Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? PixPaymentLinkFeeMode { get; set; }
    public long? PixPaymentLinkFeeFixed { get; set; }
    public int? PixPaymentLinkFeePercentage { get; set; }

    // BOLETO Limits
    public long? BoletoMinTransactionAmount { get; set; }
    public long? BoletoMaxTransactionAmount { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }

    // BOLETO API Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoApiFeeMode { get; set; }
    public long? BoletoApiFeeFixed { get; set; }
    public int? BoletoApiFeePercentage { get; set; }
    public int? BoletoReservePercentage { get; set; }
    public int? BoletoReserveCompensationDays { get; set; }

    // CREDIT CARD API Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardApiFeeMode { get; set; }
    public long? CreditCardApiFeeFixed { get; set; }
    public int? CreditCardApiFeePercentage { get; set; }
    public int? CreditCardApiInstallmentFeePercentage { get; set; }

    // CREDIT CARD Checkout Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardCheckoutFeeMode { get; set; }
    public long? CreditCardCheckoutFeeFixed { get; set; }
    public int? CreditCardCheckoutFeePercentage { get; set; }
    public int? CreditCardCheckoutInstallmentFeePercentage { get; set; }

    // CREDIT CARD Payment Link Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? CreditCardPaymentLinkFeeMode { get; set; }
    public long? CreditCardPaymentLinkFeeFixed { get; set; }
    public int? CreditCardPaymentLinkFeePercentage { get; set; }
    public int? CreditCardPaymentLinkInstallmentFeePercentage { get; set; }

    public int? CreditCardReservePercentage { get; set; }
    public int? CreditCardReserveCompensationDays { get; set; }

    // BOLETO Checkout Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoCheckoutFeeMode { get; set; }
    public long? BoletoCheckoutFeeFixed { get; set; }
    public int? BoletoCheckoutFeePercentage { get; set; }

    // BOLETO Payment Link Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? BoletoPaymentLinkFeeMode { get; set; }
    public long? BoletoPaymentLinkFeeFixed { get; set; }
    public int? BoletoPaymentLinkFeePercentage { get; set; }

    // Payment/Boleto link domains
    public string? PixPaymentLinkBaseUrl { get; set; }
    public string? BoletoPaymentLinkBaseUrl { get; set; }
    public string? CreditCardPaymentLinkBaseUrl { get; set; }
    public List<PaymentLinkDomainMethodOptions>? PaymentLinkDomainOptions { get; set; }

    // Withdrawal Fee
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FeeChargeMode? WithdrawalFeeMode { get; set; }
    public long? WithdrawalFeeFixed { get; set; }
    public int? WithdrawalFeePercentage { get; set; }
    public long? MinWithdrawalAmount { get; set; }
    public bool? WithdrawalEnabled { get; set; }
    public bool? SelfNominalSwitchEnabled { get; set; }
    
    // Withdrawal Approval
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public WithdrawalApprovalMode? WithdrawalApprovalMode { get; set; }

    // Rate Limiting
    public int? RateLimitPerMinute { get; set; }
    public int? RateLimitPerHour { get; set; }
    public int? RateLimitPerDay { get; set; }

    // Referral Settings
    public int? ReferralDurationMonths { get; set; }
    public int? ReferralCommissionPercentage { get; set; }
    public int? ReferralCommissionWithdrawalIntervalValue { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralWithdrawalIntervalUnit? ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long? ReferralCommissionMinWithdrawalAmount { get; set; }
    public long? ReferralCommissionWithdrawalFeeFixed { get; set; }

    // Automatic Cashout
    public bool? IsAutomaticCashoutEnabled { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AutomaticCashoutFrequency? AutomaticCashoutFrequency { get; set; }
    public long? AutomaticCashoutMinAmount { get; set; }
    public long? AutomaticCashoutMaxAmount { get; set; }
    public Guid? AutomaticCashoutPayoutAccountId { get; set; }
}

public sealed class UpdatePlatformSettingsRequestValidator : Validator<UpdatePlatformSettingsRequest>
{
    public UpdatePlatformSettingsRequestValidator()
    {
        RuleFor(x => x.PixMinTransactionAmount)
            .GreaterThanOrEqualTo(0).When(x => x.PixMinTransactionAmount.HasValue)
            .WithMessage("PixMinTransactionAmount deve ser maior ou igual a 0");

        RuleFor(x => x.PixMaxTransactionAmount)
            .GreaterThanOrEqualTo(0).When(x => x.PixMaxTransactionAmount.HasValue)
            .WithMessage("PixMaxTransactionAmount deve ser maior ou igual a 0");

        RuleFor(x => x.PixTimeoutMinutes)
            .InclusiveBetween(1, 1440).When(x => x.PixTimeoutMinutes.HasValue)
            .WithMessage("PixTimeoutMinutes deve estar entre 1 e 1440 minutos");

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

        RuleFor(x => x.PixPaymentLinkBaseUrl)
            .Must(BeValidAbsoluteUrl).When(x => !string.IsNullOrWhiteSpace(x.PixPaymentLinkBaseUrl))
            .WithMessage("PixPaymentLinkBaseUrl deve ser uma URL absoluta válida.");

        RuleFor(x => x.BoletoPaymentLinkBaseUrl)
            .Must(BeValidAbsoluteUrl).When(x => !string.IsNullOrWhiteSpace(x.BoletoPaymentLinkBaseUrl))
            .WithMessage("BoletoPaymentLinkBaseUrl deve ser uma URL absoluta válida.");

        RuleFor(x => x.CreditCardPaymentLinkBaseUrl)
            .Must(BeValidAbsoluteUrl).When(x => !string.IsNullOrWhiteSpace(x.CreditCardPaymentLinkBaseUrl))
            .WithMessage("CreditCardPaymentLinkBaseUrl deve ser uma URL absoluta válida.");

        RuleForEach(x => x.PaymentLinkDomainOptions)
            .ChildRules(domain =>
            {
                domain.RuleFor(d => d.Method)
                    .Must(method => method is PaymentMethod.Pix or PaymentMethod.Boleto or PaymentMethod.CreditCard)
                    .WithMessage("Método inválido na configuração de domínio de payment link.");

                domain.RuleForEach(d => d.Options)
                    .ChildRules(option =>
                    {
                        option.RuleFor(o => o.Id)
                            .NotEmpty()
                            .MaximumLength(100)
                            .WithMessage("Id da opção de domínio é obrigatório e deve ter até 100 caracteres.");

                        option.RuleFor(o => o.Name)
                            .NotEmpty()
                            .MaximumLength(150)
                            .WithMessage("Nome da opção de domínio é obrigatório e deve ter até 150 caracteres.");

                        option.RuleFor(o => o.BaseUrl)
                            .Must(BeValidAbsoluteUrl)
                            .WithMessage("BaseUrl da opção de domínio deve ser uma URL absoluta válida.");
                    });

                domain.RuleFor(d => d.Options)
                    .Must(HaveDistinctOptionIds)
                    .WithMessage("As opções de domínio do mesmo método não podem ter IDs duplicados.");

                domain.RuleFor(d => d.Options)
                    .Must(HaveSingleDefaultOption)
                    .WithMessage("Cada método pode ter no máximo uma opção de domínio marcada como padrão.");
            });

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
            .InclusiveBetween(1, 10000).When(x => x.RateLimitPerMinute.HasValue)
            .WithMessage("RateLimitPerMinute deve estar entre 1 e 10000");

        RuleFor(x => x.RateLimitPerHour)
            .InclusiveBetween(1, 100000).When(x => x.RateLimitPerHour.HasValue)
            .WithMessage("RateLimitPerHour deve estar entre 1 e 100000");

        RuleFor(x => x.RateLimitPerDay)
            .InclusiveBetween(1, 1000000).When(x => x.RateLimitPerDay.HasValue)
            .WithMessage("RateLimitPerDay deve estar entre 1 e 1000000");

        RuleFor(x => x.ReferralDurationMonths)
            .InclusiveBetween(1, 120).When(x => x.ReferralDurationMonths.HasValue)
            .WithMessage("ReferralDurationMonths deve estar entre 1 e 120 meses");

        RuleFor(x => x.ReferralCommissionPercentage)
            .InclusiveBetween(0, 10000).When(x => x.ReferralCommissionPercentage.HasValue)
            .WithMessage("ReferralCommissionPercentage deve estar entre 0 e 10000 (0% a 100%)");

        RuleFor(x => x.ReferralCommissionWithdrawalIntervalValue)
            .InclusiveBetween(0, 120).When(x => x.ReferralCommissionWithdrawalIntervalValue.HasValue)
            .WithMessage("ReferralCommissionWithdrawalIntervalValue deve estar entre 0 e 120");

        RuleFor(x => x.ReferralCommissionMinWithdrawalAmount)
            .GreaterThanOrEqualTo(0).When(x => x.ReferralCommissionMinWithdrawalAmount.HasValue)
            .WithMessage("ReferralCommissionMinWithdrawalAmount deve ser maior ou igual a 0");

        RuleFor(x => x.ReferralCommissionWithdrawalFeeFixed)
            .GreaterThanOrEqualTo(0).When(x => x.ReferralCommissionWithdrawalFeeFixed.HasValue)
            .WithMessage("ReferralCommissionWithdrawalFeeFixed deve ser maior ou igual a 0");

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
    }

    private static bool BeValidAbsoluteUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out var uri)
            && !string.IsNullOrWhiteSpace(uri.Host);
    }

    private static bool HaveDistinctOptionIds(List<PaymentLinkDomainOption>? options)
    {
        if (options == null || options.Count == 0)
        {
            return true;
        }

        return options
            .Where(o => !string.IsNullOrWhiteSpace(o.Id))
            .Select(o => o.Id.Trim().ToLowerInvariant())
            .Distinct()
            .Count() == options.Count(o => !string.IsNullOrWhiteSpace(o.Id));
    }

    private static bool HaveSingleDefaultOption(List<PaymentLinkDomainOption>? options)
    {
        if (options == null || options.Count == 0)
        {
            return true;
        }

        return options.Count(o => o.IsDefault) <= 1;
    }
}

public sealed class UpdatePlatformSettingsResponse : BaseResponse<AdminPlatformSettingsData>;

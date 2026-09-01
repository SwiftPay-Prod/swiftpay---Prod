using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Payments.CreatePaymentLink;

public sealed class CreatePaymentLinkRequest
{
    public Guid MerchantId { get; set; }
    public long? Amount { get; set; }
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CallbackUrl { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
    public string? RedirectUrl { get; set; }
    public List<string>? RequiredBuyerFields { get; set; }
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public PixLinkMode PixLinkMode { get; set; } = PixLinkMode.Dynamic;
}

public sealed class CreatePaymentLinkRequestValidator : Validator<CreatePaymentLinkRequest>
{
    public CreatePaymentLinkRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .When(x => x.PixLinkMode == PixLinkMode.Dynamic)
            .WithMessage("O valor da transação deve ser maior que zero.");


        RuleFor(x => x.EnabledMethods)
            .NotEmpty()
            .WithMessage("Selecione ao menos um método de pagamento.");

        RuleForEach(x => x.EnabledMethods)
            .Must(method => method == swiftpay_api_core.Models.Database.PaymentMethod.Pix || method == swiftpay_api_core.Models.Database.PaymentMethod.Boleto)
            .WithMessage("O método de pagamento é inválido para link de pagamento.");


        RuleFor(x => x.BoletoDueDate)
            .NotNull()
            .When(x => x.EnabledMethods.Contains(swiftpay_api_core.Models.Database.PaymentMethod.Boleto))
            .WithMessage("A data de vencimento do boleto é obrigatória.")
            .DependentRules(() =>
            {
                RuleFor(x => x.BoletoDueDate)
                    .GreaterThan(DateTime.Today)
                    .WithMessage("A data de vencimento do boleto deve ser futura.");
            });

        RuleFor(x => x.CallbackUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https"))
            .When(x => !string.IsNullOrWhiteSpace(x.CallbackUrl))
            .WithMessage("A URL de callback deve ser uma URL válida (http ou https).");

        RuleFor(x => x.RedirectUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https"))
            .When(x => !string.IsNullOrWhiteSpace(x.RedirectUrl))
            .WithMessage("A URL de redirecionamento deve ser uma URL válida (http ou https).");

        RuleForEach(x => x.RequiredBuyerFields)
            .Must(field => field == "Name" || field == "Email" || field == "Phone")
            .When(x => x.RequiredBuyerFields != null && x.RequiredBuyerFields.Count > 0)
            .WithMessage("Os campos de comprador permitidos são: Name, Email, Phone.");

        // Pix estático desabilitado temporariamente - manter código intacto, bloquear uso
        RuleFor(x => x.PixLinkMode)
            .Must(mode => mode == PixLinkMode.Dynamic)
            .WithMessage("Pix estático em breve. No momento apenas Pix dinâmico está disponível.");
    }
}

public sealed class CreatePaymentLinkResponse : BaseResponse<CreatePaymentLinkData>;

public sealed class CreatePaymentLinkData
{
    public Guid PaymentLinkId { get; set; }
    public string PaymentLinkUrl { get; set; } = string.Empty;
    public List<swiftpay_api_core.Models.Database.PaymentMethod> EnabledMethods { get; set; } = [];
    public long Amount { get; set; }
    public CurrencyType Currency { get; set; }
    public string? Description { get; set; }
    public ApiEnvironment Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public string? RedirectUrl { get; set; }
    public List<string> RequiredBuyerFields { get; set; } = [];
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
}

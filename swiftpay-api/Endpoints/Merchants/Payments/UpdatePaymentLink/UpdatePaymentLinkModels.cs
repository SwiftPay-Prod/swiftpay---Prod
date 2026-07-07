using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.Payments.ReadPaymentLink;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Payments.UpdatePaymentLink;

public sealed class UpdatePaymentLinkRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentLinkId { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public long Amount { get; set; }
    public string? Description { get; set; }
    public string? CallbackUrl { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public string? BoletoDueDate { get; set; }
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
}

public sealed class UpdatePaymentLinkRequestValidator : Validator<UpdatePaymentLinkRequest>
{
    public UpdatePaymentLinkRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentLinkId)
            .NotEmpty()
            .WithMessage("O identificador do link de pagamento é obrigatório.");

        RuleFor(x => x.EnabledMethods)
            .NotEmpty()
            .WithMessage("Pelo menos um método de pagamento deve ser selecionado.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor deve ser maior que zero.");

        RuleFor(x => x.PixExpirationMinutes)
            .InclusiveBetween(5, 1440)
            .WithMessage("A expiração do PIX deve ser entre 5 e 1440 minutos.")
            .When(x => x.PixExpirationMinutes.HasValue);

        RuleFor(x => x.ExpiresAt)
            .GreaterThan(DateTime.UtcNow)
            .WithMessage("A data de expiração deve ser no futuro.")
            .When(x => x.ExpiresAt.HasValue);
    }
}

public sealed class UpdatePaymentLinkResponse : BaseResponse<PaymentLinkDetails>;

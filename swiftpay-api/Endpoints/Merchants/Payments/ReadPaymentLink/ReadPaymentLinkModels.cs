using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Payments.ReadPaymentLink;

public sealed class ReadPaymentLinkRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentLinkId { get; set; }
}

public sealed class ReadPaymentLinkRequestValidator : Validator<ReadPaymentLinkRequest>
{
    public ReadPaymentLinkRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentLinkId)
            .NotEmpty()
            .WithMessage("O identificador do link de pagamento é obrigatório.");
    }
}

public sealed class ReadPaymentLinkResponse : BaseResponse<PaymentLinkDetails>;

public sealed class PaymentLinkDetails
{
    public Guid Id { get; set; }
    public Guid? PaymentId { get; set; }
    public string PaymentLinkUrl { get; set; } = string.Empty;
    public long Amount { get; set; }
    public PaymentMethod Method { get; set; }
    public List<PaymentMethod> EnabledMethods { get; set; } = [];
    public PaymentStatus Status { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsExpired { get; set; }
    public string LifetimeStatus { get; set; } = "Active";
    public PaymentLinkDetailsCustomer? Customer { get; set; }
    public ApiEnvironment Environment { get; set; }
    public bool ShowFees { get; set; }
    public bool PassFeeToCustomer { get; set; }
    public List<string> RequiredBuyerFields { get; set; } = [];
    public string? RedirectUrl { get; set; }
    public string? CallbackUrl { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public string? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
    public string? PrimaryColor { get; set; }
    public string? SecondaryColor { get; set; }
    public string? LogoUrl { get; set; }
    public string? ColorMode { get; set; }
    public string? ThemeMode { get; set; }
    public string? ProductName { get; set; }
    public string? ProductImageUrl { get; set; }
}

public sealed class PaymentLinkDetailsCustomer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
}

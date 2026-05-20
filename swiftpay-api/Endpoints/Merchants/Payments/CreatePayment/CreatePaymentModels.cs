using FastEndpoints;
using FluentValidation;
using System.Text.Json;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Payments.CreatePayment;

public sealed class CreatePaymentRequest
{
    public Guid MerchantId { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Pix;
    public long Amount { get; set; }
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public List<CreatePaymentItemRequest>? Items { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerDocument { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CouponCode { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public int? CardExpirationMonth { get; set; }
    public int? CardExpirationYear { get; set; }
    public int? Installments { get; set; }
    public string? CardCvv { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
}

public sealed class CreatePaymentItemRequest
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public sealed class CreatePaymentRequestValidator : Validator<CreatePaymentRequest>
{
    public CreatePaymentRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor da transação deve ser maior que zero.")
            .When(x => x.Items == null || x.Items.Count == 0);

        RuleFor(x => x.Method)
            .Must(method => Enum.IsDefined(method))
            .WithMessage("O método de pagamento é inválido.");

        RuleForEach(x => x.Items)
            .ChildRules(item =>
            {
                item.RuleFor(i => i.ProductId)
                    .NotEmpty()
                    .WithMessage("O produto é obrigatório.");

                item.RuleFor(i => i.Quantity)
                    .GreaterThan(0)
                    .WithMessage("A quantidade deve ser maior que zero.");
            })
            .When(x => x.Items != null && x.Items.Count > 0);

        RuleFor(x => x.PixExpirationMinutes)
            .InclusiveBetween(5, 1440)
            .When(x => x.PixExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração do PIX deve ser entre 5 minutos e 24 horas.");

        RuleFor(x => x.BoletoDueDate)
            .NotNull()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto é obrigatória.")
            .DependentRules(() =>
            {
                RuleFor(x => x.BoletoDueDate)
                    .Must(dueDate => dueDate.HasValue && dueDate.Value.Date >= DateTime.UtcNow.Date.AddDays(2))
                    .When(x => x.Method == PaymentMethod.Boleto && x.BoletoDueDate.HasValue)
                    .WithMessage("A data de vencimento do boleto deve ser no mínimo D+2.");
            });

        RuleFor(x => x.BoletoDueDate)
            .Null()
            .When(x => x.Method != PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto só pode ser informada para pagamentos com boleto.");

        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("O cliente é obrigatório para boleto.");

        RuleFor(x => x.CallbackUrl)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out var uri) && (uri.Scheme == "http" || uri.Scheme == "https"))
            .When(x => !string.IsNullOrEmpty(x.CallbackUrl))
            .WithMessage("A URL de callback deve ser uma URL válida (http ou https).");

        RuleFor(x => x.CustomerEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerEmail))
            .WithMessage("O email do cliente deve ser válido.");

        RuleFor(x => x.CustomerPhone)
            .Must(BeValidPhone)
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerPhone))
            .WithMessage("O telefone do cliente deve ser válido.");

        RuleFor(x => x.Metadata)
            .Must(BeValidJson)
            .When(x => !string.IsNullOrWhiteSpace(x.Metadata))
            .WithMessage("O metadata deve ser um JSON válido.");
    }

    private static bool BeValidJson(string? metadata)
    {
        if (string.IsNullOrWhiteSpace(metadata))
            return true;

        try
        {
            JsonDocument.Parse(metadata);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool BeValidPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return true;

        var digits = SanitizeUtils.SanitizePhone(phone);
        if (string.IsNullOrEmpty(digits))
            return false;

        return digits.Length is >= 10 and <= 15;
    }
}

public sealed class CreatePaymentResponse : BaseResponse<CreatePaymentData>;

public sealed class CreatePaymentData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public PaymentMethod Method { get; set; }
    public long Amount { get; set; }
    public long DiscountAmount { get; set; }
    public long AmountAfterDiscount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public CurrencyType Currency { get; set; }
    public PaymentStatus Status { get; set; }
    public string? Description { get; set; }
    public ApiEnvironment Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public Guid? CouponId { get; set; }
    public List<CreatePaymentItemData>? Items { get; set; }
    public CreatePaymentPixData? Pix { get; set; }
    public CreatePaymentBoletoData? Boleto { get; set; }
    public CreatePaymentCouponData? Coupon { get; set; }
}

public sealed class CreatePaymentItemData
{
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalAmount { get; set; }
}

public sealed class CreatePaymentPixData
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class CreatePaymentBoletoData
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}

public sealed class CreatePaymentCouponData
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public long CalculatedDiscount { get; set; }
}

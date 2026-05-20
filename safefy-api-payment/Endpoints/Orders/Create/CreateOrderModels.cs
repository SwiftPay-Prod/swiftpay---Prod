using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Orders.Create;

public sealed class CreateOrderRequest
{
    public Guid CustomerId { get; set; }
    public List<CreateOrderItemRequest> Items { get; set; } = [];
    public PaymentMethod Method { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }
    public string? ExternalId { get; set; }
    public string? CouponCode { get; set; }
    public long? ShippingAmount { get; set; }
    public CreateOrderShippingAddressRequest? ShippingAddress { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }
    public int? ExpirationMinutes { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
}

public sealed class CreateOrderItemRequest
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public sealed class CreateOrderShippingAddressRequest
{
    public string? Street { get; set; }
    public string? Number { get; set; }
    public string? Complement { get; set; }
    public string? Neighborhood { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? ZipCode { get; set; }
    public string? Country { get; set; } = "BR";
}

public sealed class CreateOrderRequestValidator : Validator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("O cliente é obrigatório.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("O pedido deve ter pelo menos um item.");

        RuleForEach(x => x.Items)
            .ChildRules(item =>
            {
                item.RuleFor(i => i.ProductId)
                    .NotEmpty()
                    .WithMessage("O produto é obrigatório.");

                item.RuleFor(i => i.Quantity)
                    .GreaterThan(0)
                    .WithMessage("A quantidade deve ser maior que zero.");
            });

        RuleFor(x => x.Method)
            .IsInEnum()
            .WithMessage("Método de pagamento inválido.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.ExternalId)
            .MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");

        RuleFor(x => x.CallbackUrl)
            .Must(BeValidUrl).When(x => !string.IsNullOrEmpty(x.CallbackUrl))
            .WithMessage("A URL de callback deve ser válida.");

        RuleFor(x => x.ShippingAmount)
            .GreaterThanOrEqualTo(0)
            .When(x => x.ShippingAmount.HasValue)
            .WithMessage("O valor do frete não pode ser negativo.");

        RuleFor(x => x.ExpirationMinutes)
            .InclusiveBetween(5, 1440)
            .When(x => x.ExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração deve ser entre 5 minutos e 24 horas.");

        RuleFor(x => x.BoletoDueDate)
            .NotNull()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto é obrigatória.")
            .DependentRules(() =>
            {
                RuleFor(x => x.BoletoDueDate)
                    .GreaterThan(DateTime.Today)
                    .WithMessage("A data de vencimento do boleto deve ser futura.");
            });
    }

    private static bool BeValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }
}

public sealed class CreateOrderResponse : BaseResponse<CreateOrderData>;

public sealed class CreateOrderData
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CustomerId { get; set; }
    public List<CreateOrderItemData> Items { get; set; } = [];
    public string? CouponCode { get; set; }
    public CreateOrderPaymentData? Payment { get; set; }
}

public sealed class CreateOrderItemData
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
}

public sealed class CreateOrderPaymentData
{
    public Guid Id { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentMethod Method { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public CreateOrderPixData? Pix { get; set; }
    public CreateOrderBoletoData? Boleto { get; set; }
}

public sealed class CreateOrderPixData
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class CreateOrderBoletoData
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}

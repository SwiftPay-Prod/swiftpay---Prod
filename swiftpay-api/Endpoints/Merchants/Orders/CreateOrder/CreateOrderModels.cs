using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Orders.CreateOrder;

public sealed class CreateOrderRequest
{
    public Guid MerchantId { get; set; }
    public Guid CustomerId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Pix;
    public List<CreateOrderItemRequest> Items { get; set; } = [];
    public string? CouponCode { get; set; }
    public long? ShippingAmount { get; set; }
    public CreateOrderShippingAddressRequest? ShippingAddress { get; set; }
    public string? Notes { get; set; }
    public string? Description { get; set; }
    public string? CallbackUrl { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
    public string? ExternalId { get; set; }
    public int? ExpirationMinutes { get; set; }
}

public sealed class CreateOrderItemRequest
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
    public long? UnitPrice { get; set; }
}

public sealed class CreateOrderShippingAddressRequest
{
    public string Street { get; set; } = null!;
    public string Number { get; set; } = null!;
    public string? Complement { get; set; }
    public string Neighborhood { get; set; } = null!;
    public string City { get; set; } = null!;
    public string State { get; set; } = null!;
    public string ZipCode { get; set; } = null!;
    public string Country { get; set; } = "BR";
}

public sealed class CreateOrderValidator : Validator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .WithMessage("O identificador do cliente é obrigatório.");

        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("O pedido deve ter pelo menos um item.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ProductId)
                .NotEmpty()
                .WithMessage("O identificador do produto é obrigatório.");

            item.RuleFor(x => x.Quantity)
                .GreaterThan(0)
                .WithMessage("A quantidade deve ser maior que zero.");
        });

        RuleFor(x => x.PaymentMethod)
            .IsInEnum()
            .WithMessage("Método de pagamento inválido.");

        When(x => x.ShippingAddress != null, () =>
        {
            RuleFor(x => x.ShippingAddress!.Street)
                .NotEmpty()
                .WithMessage("O logradouro é obrigatório.");

            RuleFor(x => x.ShippingAddress!.Number)
                .NotEmpty()
                .WithMessage("O número é obrigatório.");

            RuleFor(x => x.ShippingAddress!.Neighborhood)
                .NotEmpty()
                .WithMessage("O bairro é obrigatório.");

            RuleFor(x => x.ShippingAddress!.City)
                .NotEmpty()
                .WithMessage("A cidade é obrigatória.");

            RuleFor(x => x.ShippingAddress!.State)
                .NotEmpty()
                .WithMessage("O estado é obrigatório.");

            RuleFor(x => x.ShippingAddress!.ZipCode)
                .NotEmpty()
                .WithMessage("O CEP é obrigatório.");
        });

        RuleFor(x => x.CallbackUrl)
            .Must(url => string.IsNullOrEmpty(url) || Uri.TryCreate(url, UriKind.Absolute, out _))
            .WithMessage("A URL de callback deve ser válida.");

        RuleFor(x => x.ExpirationMinutes)
            .InclusiveBetween(5, 1440)
            .When(x => x.ExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração deve ser entre 5 e 1440 minutos.");
    }
}

public sealed class CreateOrderResponse : BaseResponse<CreateOrderData>;

public sealed class CreateOrderData
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public int ItemsCount { get; set; }
    public List<CreateOrderItemData> Items { get; set; } = [];
    public Guid PaymentId { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public long PaymentAmount { get; set; }
    public long PaymentFee { get; set; }
    public long PaymentNetAmount { get; set; }
    public CreateOrderPixData? Pix { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CreateOrderItemData
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
}

public sealed class CreateOrderPixData
{
    public string TxId { get; set; } = null!;
    public string QrCode { get; set; } = null!;
    public string CopyAndPaste { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
}

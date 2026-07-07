using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Checkout.ReserveOrder;

public sealed class ReserveOrderRequest
{
    public string ShortId { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public string? CouponCode { get; set; }
    public List<ReserveOrderItemRequest>? Items { get; set; }
    public ReserveOrderCustomerRequest? Customer { get; set; }
}

public sealed class ReserveOrderItemRequest
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public sealed class ReserveOrderCustomerRequest
{
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

public sealed class ReserveOrderRequestValidator : Validator<ReserveOrderRequest>
{
    public ReserveOrderRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.Customer)
            .NotNull().WithMessage("Os dados do cliente são obrigatórios.");

        RuleFor(x => x.Customer!.Email)
            .NotEmpty().WithMessage("O email é obrigatório.")
            .EmailAddress().WithMessage("O email deve ser válido.")
            .When(x => x.Customer != null);

        RuleFor(x => x.Customer!.Document)
            .MaximumLength(20).WithMessage("O documento deve ter no máximo 20 caracteres.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Document));

        RuleForEach(x => x.Items)
            .ChildRules(item =>
            {
                item.RuleFor(i => i.ProductId)
                    .NotEmpty().WithMessage("O produto é obrigatório.");

                item.RuleFor(i => i.Quantity)
                    .GreaterThan(0).WithMessage("A quantidade deve ser maior que zero.");
            })
            .When(x => x.Items != null && x.Items.Count > 0);
    }
}

public sealed class ReserveOrderResponse : BaseResponse<ReserveOrderData>;

public sealed class ReserveOrderData
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string? SessionId { get; set; }
    public OrderStatus Status { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public DateTime ReservedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime DisplayExpiresAt { get; set; }
    public List<ReserveOrderItemData> Items { get; set; } = [];
    public ReserveOrderCustomerData? Customer { get; set; }
}

public sealed class ReserveOrderItemData
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
    public int? AvailableStock { get; set; }
    public bool IsInStock { get; set; } = true;
}

public sealed class ReserveOrderCustomerData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

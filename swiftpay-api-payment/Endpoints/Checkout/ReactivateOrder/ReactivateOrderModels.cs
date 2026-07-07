using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Checkout.ReactivateOrder;

public sealed class ReactivateOrderRequest
{
    public string ShortId { get; set; } = string.Empty;
    public Guid OrderId { get; set; }
}

public sealed class ReactivateOrderRequestValidator : Validator<ReactivateOrderRequest>
{
    public ReactivateOrderRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.OrderId)
            .NotEmpty().WithMessage("O identificador do pedido é obrigatório.");
    }
}

public sealed class ReactivateOrderResponse : BaseResponse<ReactivateOrderData>;

public sealed class ReactivateOrderData
{
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public DateTime ReservedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime DisplayExpiresAt { get; set; }
    public List<ReactivateOrderItemData> Items { get; set; } = [];
    public ReactivateOrderCustomerData? Customer { get; set; }
}

public sealed class ReactivateOrderItemData
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
    public bool IsInStock { get; set; }
}

public sealed class ReactivateOrderCustomerData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

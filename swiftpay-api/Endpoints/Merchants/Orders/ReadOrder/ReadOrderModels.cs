using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Orders.ReadOrder;

public sealed class ReadOrderRequest
{
    public Guid MerchantId { get; set; }
    public Guid OrderId { get; set; }
}

public sealed class ReadOrderValidator : Validator<ReadOrderRequest>
{
    public ReadOrderValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.OrderId)
            .NotEmpty()
            .WithMessage("O identificador do pedido é obrigatório.");
    }
}

public sealed class ReadOrderResponse : BaseResponse<OrderDetails>;

public sealed class OrderDetails
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public ApiEnvironment Environment { get; set; }
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public string? Notes { get; set; }
    public OrderShippingAddress? ShippingAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public OrderCustomerDetails? Customer { get; set; }
    public OrderPaymentDetails? Payment { get; set; }
    public OrderCouponDetails? Coupon { get; set; }
    public List<OrderItemDetails> Items { get; set; } = [];
}

public sealed class OrderCustomerDetails
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

public sealed class OrderPaymentDetails
{
    public Guid Id { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentMethod Method { get; set; }
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long NetAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? PixQrCode { get; set; }
    public string? PixQrCodeBase64 { get; set; }
    public string? PixTxId { get; set; }
    public string? PixEndToEndId { get; set; }
}

public sealed class OrderCouponDetails
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public CouponDiscountType DiscountType { get; set; }
}

public sealed class OrderItemDetails
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = null!;
    public string? VariantName { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
}

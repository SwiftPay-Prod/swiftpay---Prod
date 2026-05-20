using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Models.PaymentApi;

public sealed class CreateOrderApiInput
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public Guid CustomerId { get; set; }
    public ApiEnvironment Environment { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public List<CreateOrderItemApiInput> Items { get; set; } = [];
    public string? CouponCode { get; set; }
    public long ShippingAmount { get; set; }
    public OrderShippingAddressApiInput? ShippingAddress { get; set; }
    public string? Notes { get; set; }
    public string? Description { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }
    public string? ExternalId { get; set; }
    public int? ExpirationMinutes { get; set; }
}

public sealed class CreateOrderItemApiInput
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
    public long? UnitPrice { get; set; }
}

public sealed class OrderShippingAddressApiInput
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

public sealed class CreateOrderApiResult
{
    public bool Success { get; set; }
    public Guid? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public OrderStatus? OrderStatus { get; set; }
    public OrderFulfillmentStatus? FulfillmentStatus { get; set; }
    public long? SubtotalAmount { get; set; }
    public long? DiscountAmount { get; set; }
    public long? ShippingAmount { get; set; }
    public long? TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public Guid? CouponId { get; set; }
    public int? ItemsCount { get; set; }
    public List<CreateOrderItemApiResult>? Items { get; set; }
    public Guid? PaymentId { get; set; }
    public PaymentStatus? PaymentStatus { get; set; }
    public long? PaymentAmount { get; set; }
    public long? PaymentFee { get; set; }
    public long? PaymentNetAmount { get; set; }
    public CreateOrderPixApiResult? Pix { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class CreateOrderItemApiResult
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public string? Sku { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
}

public sealed class CreateOrderPixApiResult
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

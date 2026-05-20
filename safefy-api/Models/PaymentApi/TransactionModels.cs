using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Models.PaymentApi;

public sealed class CreateTransactionApiInput
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public ApiEnvironment Environment { get; set; }
    public PaymentMethod Method { get; set; }
    public long Amount { get; set; }
    public CurrencyType Currency { get; set; }
    public string? Description { get; set; }
    public string? ExternalId { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public List<CreateTransactionItemApiInput>? Items { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerDocument { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CouponCode { get; set; }
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public int? CardExpirationMonth { get; set; }
    public int? CardExpirationYear { get; set; }
    public int? Installments { get; set; }
    public string? CardCvv { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
}

public sealed class CreateTransactionItemApiInput
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; } = 1;
}

public sealed class CreateTransactionApiResult
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public string? ExternalId { get; set; }
    public PaymentMethod? Method { get; set; }
    public long? Amount { get; set; }
    public long? DiscountAmount { get; set; }
    public long? AmountAfterDiscount { get; set; }
    public long? Fee { get; set; }
    public long? NetAmount { get; set; }
    public CurrencyType? Currency { get; set; }
    public PaymentStatus? Status { get; set; }
    public string? Description { get; set; }
    public ApiEnvironment? Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public Guid? CouponId { get; set; }
    public List<CreateTransactionItemApiResult>? Items { get; set; }
    public CreateTransactionPixResult? Pix { get; set; }
    public CreateTransactionBoletoResult? Boleto { get; set; }
    public CreateTransactionCouponResult? Coupon { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class CreateTransactionItemApiResult
{
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalAmount { get; set; }
}

public sealed class CreateTransactionPixResult
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class CreateTransactionBoletoResult
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}

public sealed class CreateTransactionCouponResult
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public long CalculatedDiscount { get; set; }
}

public sealed class SimulateTransactionApiInput
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class SimulateTransactionApiResult
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public PaymentStatus? Status { get; set; }
    public string? SimulatedAction { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class ReprocessCompletedTransactionDevApiInput
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
    public ReprocessTransactionTargetStatus TargetStatus { get; set; } = ReprocessTransactionTargetStatus.Completed;
}

public enum ReprocessTransactionTargetStatus
{
    Completed,
    Failed
}

public sealed class ReprocessCompletedTransactionDevApiResult
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public PaymentStatus? Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class ResendWebhookApiInput
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
}

public sealed class ResendWebhookApiResult
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public CallbackStatus? CallbackStatus { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

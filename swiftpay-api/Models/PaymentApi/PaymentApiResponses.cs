namespace safefy_api.Models.PaymentApi;

internal sealed class PaymentApiCreateCashoutResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public long? Amount { get; set; }
    public long? PlatformFee { get; set; }
    public long? NetAmount { get; set; }
    public string? PixKey { get; set; }
    public string? PixKeyType { get; set; }
    public bool RequiresApproval { get; set; }
    public List<PaymentApiCashoutPayoutItem>? Payouts { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiCashoutPayoutItem
{
    public Guid Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public long Amount { get; set; }
    public long PlatformFee { get; set; }
    public long NetAmount { get; set; }
}

internal sealed class PaymentApiEvaluateCashoutResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiCancelCashoutResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiCreateTransactionResponse
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public string? ExternalId { get; set; }
    public string? Method { get; set; }
    public long? Amount { get; set; }
    public long? Fee { get; set; }
    public long? NetAmount { get; set; }
    public string? Currency { get; set; }
    public string? Status { get; set; }
    public string? Description { get; set; }
    public string? Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public List<PaymentApiTransactionItemData>? Items { get; set; }
    public PaymentApiPixData? Pix { get; set; }
    public PaymentApiBoletoData? Boleto { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiTransactionItemData
{
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalAmount { get; set; }
}

internal sealed class PaymentApiPixData
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

internal sealed class PaymentApiBoletoData
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}

internal sealed class PaymentApiSimulateTransactionResponse
{
    public PaymentApiSimulateTransactionData? Data { get; set; }
    public PaymentApiErrorData? Error { get; set; }
    public string? Message { get; set; }
}

internal sealed class PaymentApiSimulateTransactionData
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public string? Status { get; set; }
    public string? SimulatedAction { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiReprocessCompletedTransactionDevResponse
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public string? Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiErrorData
{
    public string? Message { get; set; }
    public string? Code { get; set; }
}

internal sealed class PaymentApiSimulateCashoutResponse
{
    public PaymentApiSimulateCashoutData? Data { get; set; }
    public PaymentApiErrorData? Error { get; set; }
    public string? Message { get; set; }
}

internal sealed class PaymentApiSimulateCashoutData
{
    public Guid Id { get; set; }
    public string? Status { get; set; }
    public PaymentApiSimulateCashoutPixData? Pix { get; set; }
}

internal sealed class PaymentApiReprocessCompletedCashoutDevResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? EndToEndId { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiSimulateCashoutPixData
{
    public string? EndToEndId { get; set; }
    public string? AcquirerTransactionId { get; set; }
}

internal sealed class PaymentApiCreateOrderResponse
{
    public bool Success { get; set; }
    public Guid? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? OrderStatus { get; set; }
    public string? FulfillmentStatus { get; set; }
    public long? SubtotalAmount { get; set; }
    public long? DiscountAmount { get; set; }
    public long? ShippingAmount { get; set; }
    public long? TotalAmount { get; set; }
    public string? CouponCode { get; set; }
    public Guid? CouponId { get; set; }
    public int? ItemsCount { get; set; }
    public List<PaymentApiOrderItemData>? Items { get; set; }
    public Guid? PaymentId { get; set; }
    public string? PaymentStatus { get; set; }
    public long? PaymentAmount { get; set; }
    public long? PaymentFee { get; set; }
    public long? PaymentNetAmount { get; set; }
    public PaymentApiPixData? Pix { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiOrderItemData
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

internal sealed class PaymentApiResendWebhookResponse
{
    public PaymentApiResendWebhookData? Data { get; set; }
    public PaymentApiErrorData? Error { get; set; }
    public string? Message { get; set; }
}

internal sealed class PaymentApiResendWebhookData
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public string? CallbackStatus { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiReprocessAcquirerWebhookDevResponse
{
    public bool Success { get; set; }
    public Guid WebhookLogId { get; set; }
    public string? AcquirerType { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? Status { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

internal sealed class PaymentApiForceBankiziWebhookDevResponse
{
    public PaymentApiForceBankiziWebhookDevData? Data { get; set; }
    public PaymentApiErrorData? Error { get; set; }
    public string? Message { get; set; }
}

internal sealed class PaymentApiForceBankiziWebhookDevData
{
    public string? TxId { get; set; }
    public string? Status { get; set; }
    public bool Processed { get; set; }
}

internal sealed class PaymentApiReprocessCompletedPlatformPayoutItemDevResponse
{
    public bool Success { get; set; }
    public Guid? PlatformPayoutItemId { get; set; }
    public Guid? PlatformPayoutId { get; set; }
    public string? Status { get; set; }
    public int ProcessedItemsCount { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

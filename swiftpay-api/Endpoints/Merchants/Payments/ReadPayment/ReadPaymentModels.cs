using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Payments.ReadPayment;

public sealed class ReadPaymentRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentId { get; set; }
}

public sealed class ReadPaymentValidator : Validator<ReadPaymentRequest>
{
    public ReadPaymentValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentId)
            .NotEmpty()
            .WithMessage("O identificador da transação é obrigatório.");
    }
}

public sealed class ReadPaymentResponse : BaseResponse<PaymentDetails>;

public sealed class PaymentDetails
{
    public Guid Id { get; set; }
    public string? TransactionVisualizationUrl { get; set; }
    public string? ExternalId { get; set; }
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long CheckoutFeeAmount { get; set; }
    public long NetAmount { get; set; }
    public string? Description { get; set; }
    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentRequestSource RequestSource { get; set; } = PaymentRequestSource.Api;
    public bool IsCheckoutPayment { get; set; }
    public Guid? CheckoutId { get; set; }
    public string? CheckoutName { get; set; }
    public ApiEnvironment Environment { get; set; }
    public long ReserveDeductedAmount { get; set; }
    public string? FailureReason { get; set; }
    public string? Metadata { get; set; }
    public string? CallbackUrl { get; set; }
    public CallbackStatus CallbackStatus { get; set; }
    public int CallbackAttempts { get; set; }
    public DateTime? CallbackLastAttemptAt { get; set; }
    public string? CallbackError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public Guid? OrderId { get; set; }
    public PaymentOrderDetails? Order { get; set; }
    public PaymentCustomerDetails? Customer { get; set; }
    public PaymentPixDetails? Pix { get; set; }
    public PaymentBoletoDetails? Boleto { get; set; }
}

public sealed class PaymentOrderDetails
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public long TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<PaymentOrderItemDetails> Items { get; set; } = [];
}

public sealed class PaymentOrderItemDetails
{
    public Guid Id { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
}

public sealed class PaymentCustomerDetails
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Document { get; set; }
}

public sealed class PaymentPixDetails
{
    public string? TxId { get; set; }
    public string? EndToEndId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? PayerName { get; set; }
    public string? PayerDocument { get; set; }
    public string? PayerBank { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class PaymentBoletoDetails
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public string? ProxyUrl { get; set; }
    public DateTime? DueDate { get; set; }
}



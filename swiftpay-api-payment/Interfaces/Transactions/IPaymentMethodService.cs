using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Services.Sandbox;

namespace swiftpay_api_payment.Interfaces.Transactions;

public interface IPaymentMethodService
{
    PaymentMethod Method { get; }
    Task<PaymentMethodResult> CreateAsync(PaymentMethodInput input, CancellationToken ct = default);
}

/// <summary>
/// Input para criação de pagamento via método específico (PIX, Cartão, Boleto).
/// Usado tanto por TransactionService (gateway) quanto por OrderService (e-commerce).
/// </summary>
public record PaymentMethodInput
{
    public required Guid MerchantId { get; init; }
    public required ApiEnvironment Environment { get; init; }
    public required long Amount { get; init; }
    public required CurrencyType Currency { get; init; }
    public string? RequestOrigin { get; init; }
    public PaymentRequestSource RequestSource { get; init; } = PaymentRequestSource.Api;
    public string? Description { get; init; }
    public string? ExternalId { get; init; }
    public string? CallbackUrl { get; init; }
    public Guid? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public string? CustomerDocument { get; init; }
    public string? CustomerEmail { get; init; }
    public string? CustomerPhone { get; init; }
    public int? ExpirationMinutes { get; init; }
    public string? Metadata { get; init; }
    public bool IsCheckoutPayment { get; init; }
    public bool IsPaymentLinkPayment { get; init; }

    // Checkout template additional fee
    public FeeChargeMode? CheckoutTemplateFeeMode { get; init; }
    public long CheckoutTemplateFeeFixed { get; init; }
    public int CheckoutTemplateFeePercentage { get; init; }

    // Credit Card specific
    public string? CardNumber { get; init; }
    public string? CardHolderName { get; init; }
    public int? CardExpirationMonth { get; init; }
    public int? CardExpirationYear { get; init; }
    public int Installments { get; init; } = 1;
    public string? CardCvv { get; init; }

    // Boleto specific
    public DateTime? BoletoDueDate { get; init; }
    public string? BoletoInstructions { get; init; }
}

public record PaymentMethodResult
{
    public bool Success { get; init; }
    public Payment? Payment { get; init; }
    public PaymentPix? PaymentPix { get; init; }
    public PaymentCreditCard? PaymentCreditCard { get; init; }
    public PaymentBoleto? PaymentBoleto { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public int StatusCode { get; init; } = 200;

    public static PaymentMethodResult Fail(string message, string? code = null, int statusCode = 400) => new()
    {
        Success = false,
        ErrorMessage = message,
        ErrorCode = code,
        StatusCode = statusCode
    };
}

public record PaymentCreditCard
{
    public Guid Id { get; init; }
    public Guid PaymentId { get; init; }
    public string? Last4 { get; init; }
    public string? Brand { get; init; }
    public int Installments { get; init; }
    public string? AuthorizationCode { get; init; }
    public string? Nsu { get; init; }
}

public record PaymentBoleto
{
    public Guid Id { get; init; }
    public Guid PaymentId { get; init; }
    public string? Barcode { get; init; }
    public string? DigitableLine { get; init; }
    public string? PdfUrl { get; init; }
    public string? RecipientName { get; init; }
    public string? RecipientDocument { get; init; }
    public string? PixCopyAndPaste { get; init; }
    public DateTime? PixExpiresAt { get; init; }
    public DateTime? DueDate { get; init; }
}
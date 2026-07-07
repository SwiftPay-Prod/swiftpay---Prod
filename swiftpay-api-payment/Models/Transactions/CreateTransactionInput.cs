using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Models.Transactions;

/// <summary>
/// Input para criação de transação simples (gateway).
/// Para e-commerce com produtos, cupons e items, use OrderService.
/// </summary>
public class CreateTransactionInput
{
    public required Guid MerchantId { get; set; }
    public required PaymentMethod Method { get; set; }
    public required long Amount { get; set; }
    public required CurrencyType Currency { get; set; }
    public string? ExternalId { get; set; }
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }

    /// <summary>
    /// Origin da requisição HTTP (header Origin ou Referer)
    /// </summary>
    public string? RequestOrigin { get; set; }

    /// <summary>
    /// Origem funcional da criação do pagamento.
    /// </summary>
    public PaymentRequestSource RequestSource { get; set; } = PaymentRequestSource.Api;

    // PIX specific
    public int? ExpirationMinutes { get; set; }

    // Customer info (for acquirer)
    public string? CustomerName { get; set; }
    public string? CustomerDocument { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }

    // Credit Card specific
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public int? CardExpirationMonth { get; set; }
    public int? CardExpirationYear { get; set; }
    public int Installments { get; set; } = 1;
    public string? CardCvv { get; set; }

    // Boleto specific
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }

    // Fee source selection
    public bool IsCheckoutPayment { get; set; }
    public bool IsPaymentLinkPayment { get; set; }
}

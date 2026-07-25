using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.MagicPay.Models;

public record MagicPayPaymentResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("currency")]
    public string? Currency { get; init; }

    [JsonPropertyName("method")]
    public MagicPayPaymentMethod Method { get; init; }

    [JsonPropertyName("status")]
    public MagicPayPaymentStatus Status { get; init; }

    [JsonPropertyName("externalRef")]
    public string? ExternalRef { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("data")]
    public MagicPayPaymentData? Data { get; init; }
}

public record MagicPayPaymentData
{
    [JsonPropertyName("method")]
    public string? Method { get; init; }

    [JsonPropertyName("copypaste")]
    public string? Copypaste { get; init; }

    [JsonPropertyName("e2e")]
    public string? E2e { get; init; }

    [JsonPropertyName("qrcode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("brand")]
    public string? Brand { get; init; }

    [JsonPropertyName("authorizationCode")]
    public string? AuthorizationCode { get; init; }

    [JsonPropertyName("nsu")]
    public string? Nsu { get; init; }

    [JsonPropertyName("last4")]
    public string? Last4 { get; init; }

    [JsonPropertyName("installments")]
    public int? Installments { get; init; }

    [JsonPropertyName("barcode")]
    public string? Barcode { get; init; }

    [JsonPropertyName("digitableLine")]
    public string? DigitableLine { get; init; }

    [JsonPropertyName("pdfUrl")]
    public string? PdfUrl { get; init; }
}

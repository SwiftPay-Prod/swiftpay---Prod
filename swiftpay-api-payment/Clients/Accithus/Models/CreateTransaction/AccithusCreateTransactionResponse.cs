using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.CreateTransaction;

public sealed class AccithusCreateTransactionResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public long? Amount { get; set; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("qr_code")]
    public string? QrCode { get; set; }

    [JsonPropertyName("qr_code_url")]
    public string? QrCodeUrl { get; set; }

    [JsonPropertyName("copy_paste")]
    public string? CopyPaste { get; set; }

    [JsonPropertyName("barcode")]
    public string? Barcode { get; set; }

    [JsonPropertyName("barcode_url")]
    public string? BarcodeUrl { get; set; }

    [JsonPropertyName("pdf_url")]
    public string? PdfUrl { get; set; }

    [JsonPropertyName("due_date")]
    public string? DueDate { get; set; }

    [JsonPropertyName("tx_id")]
    public string? TxId { get; set; }

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("authorization_code")]
    public string? AuthorizationCode { get; set; }

    [JsonPropertyName("nsu")]
    public string? Nsu { get; set; }

    [JsonPropertyName("brand")]
    public string? Brand { get; set; }

    [JsonPropertyName("last4")]
    public string? Last4 { get; set; }

    [JsonPropertyName("installments")]
    public int? Installments { get; set; }

    [JsonPropertyName("credit_card")]
    public AccithusCreditCardResponseData? CreditCard { get; set; }
}

public sealed class AccithusCreditCardResponseData
{
    [JsonPropertyName("authorization_code")]
    public string? AuthorizationCode { get; set; }

    [JsonPropertyName("nsu")]
    public string? Nsu { get; set; }

    [JsonPropertyName("brand")]
    public string? Brand { get; set; }

    [JsonPropertyName("last4")]
    public string? Last4 { get; set; }

    [JsonPropertyName("installments")]
    public int? Installments { get; set; }
}

using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.HeartPay.Models.Charges;

public sealed class HeartPayCreateChargeRequest
{
    [JsonPropertyName("value")]
    public long Value { get; set; }

    [JsonPropertyName("comment")]
    public string? Comment { get; set; }

    [JsonPropertyName("correlationID")]
    public string? CorrelationId { get; set; }

    [JsonPropertyName("customer")]
    public HeartPayChargeCustomerRequest Customer { get; set; } = new();

    [JsonPropertyName("identifier")]
    public string? Identifier { get; set; }

    [JsonPropertyName("expiresDate")]
    public DateTime? ExpiresDate { get; set; }
}

public sealed class HeartPayChargeCustomerRequest
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("taxID")]
    public string TaxId { get; set; } = string.Empty;
}

public sealed class HeartPayChargeData
{
    public string? Id { get; set; }
    public string? CorrelationId { get; set; }
    public string? Status { get; set; }
    public string? TxId { get; set; }
    public string? BrCode { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public string? PaymentLinkUrl { get; set; }
    public string? EndToEndId { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? ErrorMessage { get; set; }
}

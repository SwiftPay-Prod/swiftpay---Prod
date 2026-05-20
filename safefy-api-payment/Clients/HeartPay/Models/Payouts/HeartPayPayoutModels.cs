using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.HeartPay.Models.Payouts;

public sealed class HeartPayCreatePayoutRequest
{
    [JsonPropertyName("value")]
    public long Value { get; set; }

    [JsonPropertyName("pixKeyType")]
    public string PixKeyType { get; set; } = string.Empty;

    [JsonPropertyName("pixKey")]
    public string PixKey { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("correlationID")]
    public string? CorrelationId { get; set; }
}

public sealed class HeartPayPayoutData
{
    public string? Id { get; set; }
    public string? CorrelationId { get; set; }
    public string? ReferenceCode { get; set; }
    public string? Status { get; set; }
    public string? EndToEndId { get; set; }
    public string? PixKey { get; set; }
    public string? PixKeyType { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? ErrorMessage { get; set; }
}

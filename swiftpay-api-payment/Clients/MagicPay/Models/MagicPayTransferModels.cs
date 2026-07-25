using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.MagicPay.Models;

public record MagicPayTransferRequest
{
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    [JsonPropertyName("method")]
    public string Method { get; init; } = "PIX";

    [JsonPropertyName("externalRef")]
    public string? ExternalRef { get; init; }

    [JsonPropertyName("notificationUrl")]
    public string? NotificationUrl { get; init; }

    [JsonPropertyName("pix")]
    public required MagicPayTransferPix Pix { get; init; }
}

public record MagicPayTransferPix
{
    [JsonPropertyName("pixKeyType")]
    public required string PixKeyType { get; init; }

    [JsonPropertyName("pixKey")]
    public required string PixKey { get; init; }
}

public record MagicPayTransferResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("method")]
    public string? Method { get; init; }

    [JsonPropertyName("status")]
    public MagicPayTransferStatus Status { get; init; }

    [JsonPropertyName("externalRef")]
    public string? ExternalRef { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("fee")]
    public long? Fee { get; init; }
}

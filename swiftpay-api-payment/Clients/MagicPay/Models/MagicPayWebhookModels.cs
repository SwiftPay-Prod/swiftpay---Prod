using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.MagicPay.Models;

public record MagicPayWebhookRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("type")]
    public string? Type { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("data")]
    public MagicPayWebhookData? Data { get; init; }
}

public record MagicPayWebhookData
{
    [JsonPropertyName("payment")]
    public MagicPayPaymentResponse? Payment { get; init; }

    [JsonPropertyName("transfer")]
    public MagicPayTransferResponse? Transfer { get; init; }
}

public record MagicPayWebhookResponse
{
    [JsonPropertyName("received")]
    public bool Received { get; init; } = true;
}

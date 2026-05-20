using System.Text.Json.Serialization;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Clients.HeartPay.Models.Webhook;

public sealed class HeartPayWebhookResponse : BaseResponse<HeartPayWebhookData>;

public sealed class HeartPayWebhookRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("event")]
    public HeartPayWebhookEventType? Event { get; init; }

    [JsonPropertyName("type")]
    public HeartPayWebhookType? Type { get; init; }

    [JsonPropertyName("status")]
    public HeartPayWebhookStatus? Status { get; init; }

    [JsonPropertyName("chargeId")]
    public string? ChargeId { get; init; }

    [JsonPropertyName("correlationID")]
    public string? CorrelationId { get; init; }

    [JsonPropertyName("payoutId")]
    public string? PayoutId { get; init; }

    [JsonPropertyName("txId")]
    public string? TxId { get; init; }

    [JsonPropertyName("txid")]
    public string? TxIdLower { get; init; }

    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; init; }

    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("data")]
    public HeartPayWebhookPayload? Data { get; init; }
}

public sealed class HeartPayWebhookPayload
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("event")]
    public HeartPayWebhookEventType? Event { get; init; }

    [JsonPropertyName("type")]
    public HeartPayWebhookType? Type { get; init; }

    [JsonPropertyName("status")]
    public HeartPayWebhookStatus? Status { get; init; }

    [JsonPropertyName("chargeId")]
    public string? ChargeId { get; init; }

    [JsonPropertyName("correlationID")]
    public string? CorrelationId { get; init; }

    [JsonPropertyName("payoutId")]
    public string? PayoutId { get; init; }

    [JsonPropertyName("txId")]
    public string? TxId { get; init; }

    [JsonPropertyName("txid")]
    public string? TxIdLower { get; init; }

    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; init; }

    [JsonPropertyName("paidAt")]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("pix")]
    public HeartPayWebhookPixPayload? Pix { get; init; }

    [JsonPropertyName("data")]
    public HeartPayWebhookPayload? Data { get; init; }
}

public sealed class HeartPayWebhookPixPayload
{
    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("key")]
    public string? Key { get; init; }

    [JsonPropertyName("keyType")]
    public string? KeyType { get; init; }
}

public sealed class HeartPayWebhookData
{
    public bool Processed { get; set; }
}

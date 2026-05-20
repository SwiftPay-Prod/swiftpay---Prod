using System.Text.Json.Serialization;
using safefy_api_payment.Clients.Pluggou.Models.Transactions;
using safefy_api_payment.Clients.Pluggou.Models.Withdrawals;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.Pluggou.Models.Webhook;

public sealed class PluggouWebhookResponse : BaseResponse<PluggouWebhookData>;

public sealed class PluggouWebhookRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("event_type")]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public PluggouWebhookEventType? EventType { get; init; }

    [JsonPropertyName("data")]
    public PluggouWebhookPayload? Data { get; init; }
}

public enum PluggouWebhookEventType
{
    Unknown,
    Transaction,
    Withdrawal
}

public sealed class PluggouWebhookData
{
    public bool Processed { get; set; }
}

public sealed class PluggouWebhookPayload
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("payment_method")]
    public PluggouPaymentMethod? PaymentMethod { get; init; }

    [JsonPropertyName("e2e_id")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("platform_tax")]
    public long? PlatformTax { get; init; }

    [JsonPropertyName("liquid_amount")]
    public long? LiquidAmount { get; init; }

    [JsonPropertyName("status")]
    public PluggouWebhookStatus? Status { get; init; }

    [JsonPropertyName("paid_at")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    [JsonPropertyName("created_at")]
    public string? CreatedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? CreatedAt => WebhookDateTimeConverter.ParseNullableDateTime(CreatedAtRaw);

    [JsonPropertyName("pix_type")]
    public PluggouPixKeyType? PixType { get; init; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; init; }
}

using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.Coldfy.Models.Payments;
using swiftpay_api_payment.Clients.Coldfy.Models.Withdrawals;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Utils;

namespace swiftpay_api_payment.Clients.Coldfy.Models.Webhook;

public sealed class ColdfyWebhookRequest
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("type")]
    public ColdfyWebhookObjectType? Type { get; init; }

    [JsonPropertyName("objectId")]
    public string? ObjectId { get; init; }

    [JsonPropertyName("event")]
    public ColdfyWebhookEventType? Event { get; init; }

    [JsonPropertyName("timestamp")]
    public string? TimestampRaw { get; init; }

    [JsonIgnore]
    public DateTime? Timestamp => WebhookDateTimeConverter.ParseNullableDateTime(TimestampRaw);

    [JsonPropertyName("data")]
    public ColdfyWebhookTransactionData? Data { get; init; }

    [JsonPropertyName("withdrawal")]
    public ColdfyWebhookWithdrawal? Withdrawal { get; init; }
}

public sealed class ColdfyWebhookTransactionData
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("status")]
    public ColdfyPaymentStatus? Status { get; init; }

    [JsonPropertyName("paymentMethod")]
    public ColdfyPaymentMethod? PaymentMethod { get; init; }

    [JsonPropertyName("paidAt")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    [JsonPropertyName("customer")]
    public ColdfyWebhookCustomer? Customer { get; init; }

    [JsonPropertyName("pix")]
    public ColdfyWebhookPix? Pix { get; init; }
}

public sealed class ColdfyWebhookCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("document")]
    public string? Document { get; init; }
}

public sealed class ColdfyWebhookPix
{
    [JsonPropertyName("end2EndId")]
    public string? End2EndId { get; init; }
}

public sealed class ColdfyWebhookWithdrawal
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("status")]
    public ColdfyWithdrawalStatus? Status { get; init; }

    [JsonPropertyName("paid_at")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    [JsonPropertyName("pix")]
    public ColdfyWebhookWithdrawalPix? Pix { get; init; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
}

public sealed class ColdfyWebhookWithdrawalPix
{
    [JsonPropertyName("end_to_end_id")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("key_value")]
    public string? KeyValue { get; init; }

    [JsonPropertyName("key_type")]
    public ColdfyPixKeyType? KeyType { get; init; }
}

public sealed class ColdfyWebhookResponse : BaseResponse<ColdfyWebhookData>;

public sealed class ColdfyWebhookData
{
    public bool Processed { get; set; }
}

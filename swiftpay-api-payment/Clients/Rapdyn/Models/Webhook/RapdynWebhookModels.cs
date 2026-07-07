using System.Text.Json.Serialization;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Utils;

namespace swiftpay_api_payment.Clients.Rapdyn.Models.Webhook;

public sealed class RapdynWebhookRequest
{
    [JsonPropertyName("notification_type")]
    public RapdynWebhookNotificationType? NotificationType { get; init; }

    [JsonPropertyName("id")]
    public string? TransactionId { get; init; }

    [JsonPropertyName("external_id")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("total")]
    public long? Total { get; init; }

    [JsonPropertyName("method")]
    public string? Method { get; init; }

    [JsonPropertyName("status")]
    public RapdynWebhookStatus? Status { get; init; }

    [JsonPropertyName("started_at")]
    public string? StartedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? StartedAt => WebhookDateTimeConverter.ParseNullableDateTime(StartedAtRaw);

    [JsonPropertyName("completed_at")]
    public string? CompletedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? CompletedAt => WebhookDateTimeConverter.ParseNullableDateTime(CompletedAtRaw);

    [JsonPropertyName("pix")]
    public RapdynWebhookPix? Pix { get; init; }

    [JsonPropertyName("customer")]
    public RapdynWebhookCustomer? Customer { get; init; }

    [JsonPropertyName("delivery")]
    public RapdynWebhookDelivery? Delivery { get; init; }

    [JsonPropertyName("products")]
    public List<RapdynWebhookProduct>? Products { get; init; }

    [JsonPropertyName("transfer_id")]
    public string? TransferId { get; init; }

    [JsonPropertyName("value")]
    public string? Value { get; init; }

    [JsonPropertyName("tax")]
    public string? Tax { get; init; }

    [JsonPropertyName("pix_key_type")]
    public string? PixKeyType { get; init; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; init; }

    [JsonPropertyName("end2EndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("dates")]
    public RapdynWebhookDates? Dates { get; init; }
}

public sealed class RapdynWebhookPix
{
    [JsonPropertyName("qrcode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("end2EndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("copypaste")]
    public string? CopyPaste { get; init; }
}

public sealed class RapdynWebhookCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("phone")]
    public string? Phone { get; init; }

    [JsonPropertyName("document")]
    [JsonConverter(typeof(RapdynWebhookDocumentConverter))]
    public RapdynWebhookDocument? Document { get; init; }
}

public sealed class RapdynWebhookDocument
{
    [JsonPropertyName("type")]
    public string? Type { get; init; }

    [JsonPropertyName("value")]
    public string? Value { get; init; }
}

public sealed class RapdynWebhookDelivery
{
    [JsonPropertyName("street")]
    public string? Street { get; init; }

    [JsonPropertyName("number")]
    public string? Number { get; init; }

    [JsonPropertyName("neighborhood")]
    public string? Neighborhood { get; init; }

    [JsonPropertyName("city")]
    public string? City { get; init; }

    [JsonPropertyName("state")]
    public string? State { get; init; }

    [JsonPropertyName("zipcode")]
    public string? Zipcode { get; init; }
}

public sealed class RapdynWebhookProduct
{
    [JsonPropertyName("id")]
    [JsonConverter(typeof(RapdynFlexibleStringConverter))]
    public string? Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("type")]
    public string? Type { get; init; }

    [JsonPropertyName("price")]
    public long? Price { get; init; }

    [JsonPropertyName("quantity")]
    [JsonConverter(typeof(RapdynFlexibleStringConverter))]
    public string? Quantity { get; init; }
}

public sealed class RapdynWebhookDates
{
    [JsonPropertyName("started_at")]
    public string? StartedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? StartedAt => WebhookDateTimeConverter.ParseNullableDateTime(StartedAtRaw);

    [JsonPropertyName("completed_at")]
    public string? CompletedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? CompletedAt => WebhookDateTimeConverter.ParseNullableDateTime(CompletedAtRaw);
}

public sealed class RapdynWebhookResponse : BaseResponse<RapdynWebhookData>;

public sealed class RapdynWebhookData
{
    public bool Processed { get; set; }
}
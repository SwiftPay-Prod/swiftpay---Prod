using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.HeartPay.Models.Webhook;

[JsonConverter(typeof(HeartPayWebhookStatusConverter))]
public enum HeartPayWebhookStatus
{
    Unknown,
    Pending,
    Processing,
    Paid,
    Completed,
    Done,
    Failed,
    Error,
    Rejected,
    Refused,
    Cancelled,
    Expired,
    Refunded,
    PartiallyRefunded
}

public sealed class HeartPayWebhookStatusConverter : JsonConverter<HeartPayWebhookStatus>
{
    public override HeartPayWebhookStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return HeartPayWebhookStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" or "generated" or "waiting_payment" => HeartPayWebhookStatus.Pending,
            "processing" => HeartPayWebhookStatus.Processing,
            "paid" => HeartPayWebhookStatus.Paid,
            "completed" => HeartPayWebhookStatus.Completed,
            "done" or "success" or "succeeded" => HeartPayWebhookStatus.Done,
            "failed" => HeartPayWebhookStatus.Failed,
            "error" => HeartPayWebhookStatus.Error,
            "rejected" => HeartPayWebhookStatus.Rejected,
            "refused" => HeartPayWebhookStatus.Refused,
            "cancelled" or "canceled" => HeartPayWebhookStatus.Cancelled,
            "expired" => HeartPayWebhookStatus.Expired,
            "refunded" => HeartPayWebhookStatus.Refunded,
            "partially_refunded" => HeartPayWebhookStatus.PartiallyRefunded,
            _ => HeartPayWebhookStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, HeartPayWebhookStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            HeartPayWebhookStatus.Pending => "pending",
            HeartPayWebhookStatus.Processing => "processing",
            HeartPayWebhookStatus.Paid => "paid",
            HeartPayWebhookStatus.Completed => "completed",
            HeartPayWebhookStatus.Done => "done",
            HeartPayWebhookStatus.Failed => "failed",
            HeartPayWebhookStatus.Error => "error",
            HeartPayWebhookStatus.Rejected => "rejected",
            HeartPayWebhookStatus.Refused => "refused",
            HeartPayWebhookStatus.Cancelled => "cancelled",
            HeartPayWebhookStatus.Expired => "expired",
            HeartPayWebhookStatus.Refunded => "refunded",
            HeartPayWebhookStatus.PartiallyRefunded => "partially_refunded",
            _ => "unknown"
        };

        writer.WriteStringValue(stringValue);
    }
}

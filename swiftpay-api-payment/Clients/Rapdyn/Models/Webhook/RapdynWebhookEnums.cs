using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Rapdyn.Models.Webhook;

[JsonConverter(typeof(RapdynWebhookNotificationTypeConverter))]
public enum RapdynWebhookNotificationType
{
    Unknown,
    Transaction,
    TransferOut
}

public sealed class RapdynWebhookNotificationTypeConverter : JsonConverter<RapdynWebhookNotificationType>
{
    public override RapdynWebhookNotificationType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynWebhookNotificationType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "transaction" => RapdynWebhookNotificationType.Transaction,
            "transfer_out" => RapdynWebhookNotificationType.TransferOut,
            _ => RapdynWebhookNotificationType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynWebhookNotificationType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynWebhookNotificationType.TransferOut => "transfer_out",
            RapdynWebhookNotificationType.Transaction => "transaction",
            _ => "transaction"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(RapdynWebhookStatusConverter))]
public enum RapdynWebhookStatus
{
    Unknown,
    Paid,
    Failed,
    Returned,
    Cancelled,
    Blocked,
    Med,
    Processing,
    Pending,
    Completed,
    Done,
    Refunded,
    Canceled
}

public sealed class RapdynWebhookStatusConverter : JsonConverter<RapdynWebhookStatus>
{
    public override RapdynWebhookStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynWebhookStatus.Unknown;

        var normalized = value.Trim().ToLowerInvariant();
        return normalized switch
        {
            "paid" => RapdynWebhookStatus.Paid,
            "failed" => RapdynWebhookStatus.Failed,
            "returned" => RapdynWebhookStatus.Returned,
            "cancelled" => RapdynWebhookStatus.Cancelled,
            "canceled" => RapdynWebhookStatus.Canceled,
            "blocked" => RapdynWebhookStatus.Blocked,
            "med" => RapdynWebhookStatus.Med,
            "processing" => RapdynWebhookStatus.Processing,
            "pending" => RapdynWebhookStatus.Pending,
            "completed" => RapdynWebhookStatus.Completed,
            "done" => RapdynWebhookStatus.Done,
            "refunded" => RapdynWebhookStatus.Refunded,
            _ => RapdynWebhookStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynWebhookStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynWebhookStatus.Paid => "paid",
            RapdynWebhookStatus.Failed => "failed",
            RapdynWebhookStatus.Returned => "returned",
            RapdynWebhookStatus.Cancelled => "cancelled",
            RapdynWebhookStatus.Canceled => "canceled",
            RapdynWebhookStatus.Blocked => "blocked",
            RapdynWebhookStatus.Med => "med",
            RapdynWebhookStatus.Processing => "processing",
            RapdynWebhookStatus.Pending => "pending",
            RapdynWebhookStatus.Completed => "completed",
            RapdynWebhookStatus.Done => "done",
            RapdynWebhookStatus.Refunded => "refunded",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Pluggou.Models.Webhook;

[JsonConverter(typeof(PluggouWebhookStatusConverter))]
public enum PluggouWebhookStatus
{
    Unknown,
    Pending,
    Approved,
    Paid,
    Failed,
    Canceled,
    Refunded,
    Chargeback
}

public sealed class PluggouWebhookStatusConverter : JsonConverter<PluggouWebhookStatus>
{
    public override PluggouWebhookStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return PluggouWebhookStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => PluggouWebhookStatus.Pending,
            "approved" => PluggouWebhookStatus.Approved,
            "paid" => PluggouWebhookStatus.Paid,
            "failed" => PluggouWebhookStatus.Failed,
            "canceled" => PluggouWebhookStatus.Canceled,
            "cancelled" => PluggouWebhookStatus.Canceled,
            "refunded" => PluggouWebhookStatus.Refunded,
            "chargeback" => PluggouWebhookStatus.Chargeback,
            _ => PluggouWebhookStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, PluggouWebhookStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            PluggouWebhookStatus.Pending => "pending",
            PluggouWebhookStatus.Approved => "approved",
            PluggouWebhookStatus.Paid => "paid",
            PluggouWebhookStatus.Failed => "failed",
            PluggouWebhookStatus.Canceled => "canceled",
            PluggouWebhookStatus.Refunded => "refunded",
            PluggouWebhookStatus.Chargeback => "chargeback",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

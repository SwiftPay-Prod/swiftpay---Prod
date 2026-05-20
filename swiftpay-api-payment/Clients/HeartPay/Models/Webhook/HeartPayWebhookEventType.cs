using System.Text.Json;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.HeartPay.Models.Webhook;

[JsonConverter(typeof(HeartPayWebhookEventTypeConverter))]
public enum HeartPayWebhookEventType
{
    Unknown,
    ChargeCreated,
    ChargeUpdated,
    ChargePaid,
    ChargeFailed,
    ChargeCancelled,
    ChargeExpired,
    PayoutCreated,
    PayoutUpdated,
    PayoutCompleted,
    PayoutFailed,
    PayoutRejected,
    PayoutCancelled
}

public sealed class HeartPayWebhookEventTypeConverter : JsonConverter<HeartPayWebhookEventType>
{
    public override HeartPayWebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return HeartPayWebhookEventType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "charge.created" => HeartPayWebhookEventType.ChargeCreated,
            "charge.updated" => HeartPayWebhookEventType.ChargeUpdated,
            "charge.paid" or "pixin.paid" or "payincompleted" or "payin.completed" or "pay_in_completed" => HeartPayWebhookEventType.ChargePaid,
            "charge.failed" or "charge.refused" or "charge.rejected" => HeartPayWebhookEventType.ChargeFailed,
            "charge.cancelled" or "charge.canceled" => HeartPayWebhookEventType.ChargeCancelled,
            "charge.expired" => HeartPayWebhookEventType.ChargeExpired,
            "payout.created" or "withdrawal.created" => HeartPayWebhookEventType.PayoutCreated,
            "payout.updated" or "withdrawal.updated" => HeartPayWebhookEventType.PayoutUpdated,
            "payout.done" or "payout.completed" or "payout.success" or "withdrawal.done" or "payoutcompleted" or "payout.completed" or "pay_out_completed" => HeartPayWebhookEventType.PayoutCompleted,
            "payout.failed" or "payout.error" or "withdrawal.failed" => HeartPayWebhookEventType.PayoutFailed,
            "payout.rejected" or "payout.refused" or "withdrawal.rejected" => HeartPayWebhookEventType.PayoutRejected,
            "payout.cancelled" or "payout.canceled" or "withdrawal.cancelled" or "withdrawal.canceled" => HeartPayWebhookEventType.PayoutCancelled,
            _ => HeartPayWebhookEventType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, HeartPayWebhookEventType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            HeartPayWebhookEventType.ChargeCreated => "charge.created",
            HeartPayWebhookEventType.ChargeUpdated => "charge.updated",
            HeartPayWebhookEventType.ChargePaid => "charge.paid",
            HeartPayWebhookEventType.ChargeFailed => "charge.failed",
            HeartPayWebhookEventType.ChargeCancelled => "charge.cancelled",
            HeartPayWebhookEventType.ChargeExpired => "charge.expired",
            HeartPayWebhookEventType.PayoutCreated => "payout.created",
            HeartPayWebhookEventType.PayoutUpdated => "payout.updated",
            HeartPayWebhookEventType.PayoutCompleted => "payout.done",
            HeartPayWebhookEventType.PayoutFailed => "payout.failed",
            HeartPayWebhookEventType.PayoutRejected => "payout.rejected",
            HeartPayWebhookEventType.PayoutCancelled => "payout.cancelled",
            _ => "unknown"
        };

        writer.WriteStringValue(stringValue);
    }
}

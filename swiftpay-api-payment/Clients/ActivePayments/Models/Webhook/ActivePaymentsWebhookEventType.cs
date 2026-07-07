using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.Webhook;

[JsonConverter(typeof(ActivePaymentsWebhookEventTypeConverter))]
public enum ActivePaymentsWebhookEventType
{
    Unknown,
    Ping,
    ChargePaid,
    ChargeCancelled,
    ChargeExpired,
    ChargeFailed,
    BilletPaid,
    BilletExpired,
    WithdrawalCompleted,
    WithdrawalDone,
    WithdrawalApproved,
    WithdrawalFailed,
    WithdrawalRejected
}

public sealed class ActivePaymentsWebhookEventTypeConverter : JsonConverter<ActivePaymentsWebhookEventType>
{
    public override ActivePaymentsWebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ActivePaymentsWebhookEventType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "ping" => ActivePaymentsWebhookEventType.Ping,
            "charge.paid" => ActivePaymentsWebhookEventType.ChargePaid,
            "charge.cancelled" => ActivePaymentsWebhookEventType.ChargeCancelled,
            "charge.expired" => ActivePaymentsWebhookEventType.ChargeExpired,
            "charge.failed" => ActivePaymentsWebhookEventType.ChargeFailed,
            "billet.paid" => ActivePaymentsWebhookEventType.BilletPaid,
            "billet.expired" => ActivePaymentsWebhookEventType.BilletExpired,
            "withdrawal.completed" => ActivePaymentsWebhookEventType.WithdrawalCompleted,
            "withdrawal.done" => ActivePaymentsWebhookEventType.WithdrawalDone,
            "withdrawal.approved" => ActivePaymentsWebhookEventType.WithdrawalApproved,
            "withdrawal.failed" => ActivePaymentsWebhookEventType.WithdrawalFailed,
            "withdrawal.rejected" => ActivePaymentsWebhookEventType.WithdrawalRejected,
            _ => ActivePaymentsWebhookEventType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsWebhookEventType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ActivePaymentsWebhookEventType.Ping => "ping",
            ActivePaymentsWebhookEventType.ChargePaid => "charge.paid",
            ActivePaymentsWebhookEventType.ChargeCancelled => "charge.cancelled",
            ActivePaymentsWebhookEventType.ChargeExpired => "charge.expired",
            ActivePaymentsWebhookEventType.ChargeFailed => "charge.failed",
            ActivePaymentsWebhookEventType.BilletPaid => "billet.paid",
            ActivePaymentsWebhookEventType.BilletExpired => "billet.expired",
            ActivePaymentsWebhookEventType.WithdrawalCompleted => "withdrawal.completed",
            ActivePaymentsWebhookEventType.WithdrawalDone => "withdrawal.done",
            ActivePaymentsWebhookEventType.WithdrawalApproved => "withdrawal.approved",
            ActivePaymentsWebhookEventType.WithdrawalFailed => "withdrawal.failed",
            ActivePaymentsWebhookEventType.WithdrawalRejected => "withdrawal.rejected",
            _ => "ping"
        };

        writer.WriteStringValue(stringValue);
    }
}

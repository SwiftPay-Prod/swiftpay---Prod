using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.Webhook;

public sealed class ActivePaymentsWebhookRequestConverter : JsonConverter<ActivePaymentsWebhookRequest>
{
    public override ActivePaymentsWebhookRequest Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var root = doc.RootElement;

        var eventType = root.TryGetProperty("event", out var eventElement)
            ? JsonSerializer.Deserialize<ActivePaymentsWebhookEventType>(eventElement.GetRawText(), options)
            : ActivePaymentsWebhookEventType.Unknown;

        var timestampRaw = root.TryGetProperty("timestamp", out var timestampElement)
            && timestampElement.ValueKind == JsonValueKind.String
            ? timestampElement.GetString()
            : null;

        ActivePaymentsChargeWebhookData? charge = null;
        ActivePaymentsWithdrawWebhookData? withdrawal = null;

        if (root.TryGetProperty("data", out var dataElement) && dataElement.ValueKind == JsonValueKind.Object)
        {
            if (IsChargeEvent(eventType))
            {
                charge = JsonSerializer.Deserialize<ActivePaymentsChargeWebhookData>(dataElement.GetRawText(), options);
            }
            else if (IsWithdrawalEvent(eventType))
            {
                withdrawal = JsonSerializer.Deserialize<ActivePaymentsWithdrawWebhookData>(dataElement.GetRawText(), options);
            }
        }

        return new ActivePaymentsWebhookRequest
        {
            Event = eventType,
            TimestampRaw = timestampRaw,
            Charge = charge,
            Withdrawal = withdrawal
        };
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsWebhookRequest value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();

        writer.WritePropertyName("event");
        JsonSerializer.Serialize(writer, value.Event, options);

        if (!string.IsNullOrWhiteSpace(value.TimestampRaw))
        {
            writer.WriteString("timestamp", value.TimestampRaw);
        }

        writer.WritePropertyName("data");
        if (IsWithdrawalEvent(value.Event))
        {
            JsonSerializer.Serialize(writer, value.Withdrawal, options);
        }
        else
        {
            JsonSerializer.Serialize(writer, value.Charge, options);
        }

        writer.WriteEndObject();
    }

    private static bool IsChargeEvent(ActivePaymentsWebhookEventType eventType)
    {
        return eventType is ActivePaymentsWebhookEventType.ChargePaid
            or ActivePaymentsWebhookEventType.ChargeCancelled
            or ActivePaymentsWebhookEventType.ChargeExpired
            or ActivePaymentsWebhookEventType.ChargeFailed
            or ActivePaymentsWebhookEventType.BilletPaid
            or ActivePaymentsWebhookEventType.BilletExpired;
    }

    private static bool IsWithdrawalEvent(ActivePaymentsWebhookEventType eventType)
    {
        return eventType is ActivePaymentsWebhookEventType.WithdrawalCompleted
            or ActivePaymentsWebhookEventType.WithdrawalDone
            or ActivePaymentsWebhookEventType.WithdrawalApproved
            or ActivePaymentsWebhookEventType.WithdrawalFailed
            or ActivePaymentsWebhookEventType.WithdrawalRejected;
    }
}

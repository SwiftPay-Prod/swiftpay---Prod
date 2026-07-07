using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.HunterPay.Models.Webhook;

[JsonConverter(typeof(HunterPayWebhookEventTypeConverter))]
public enum HunterPayWebhookEventType
{
    Unknown,
    TransactionCreated,
    TransactionUpdated,
    TransactionPaid,
    TransactionRefunded,
    TransactionFailed,
    TransactionCancelled,
    WithdrawalCreated,
    WithdrawalUpdated,
    WithdrawalCompleted,
    WithdrawalFailed,
    WithdrawalRejected,
    WithdrawalCancelled
}

public sealed class HunterPayWebhookEventTypeConverter : JsonConverter<HunterPayWebhookEventType>
{
    public override HunterPayWebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return HunterPayWebhookEventType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "transaction.created" => HunterPayWebhookEventType.TransactionCreated,
            "transaction.updated" => HunterPayWebhookEventType.TransactionUpdated,
            "transaction.paid" => HunterPayWebhookEventType.TransactionPaid,
            "transaction.refunded" => HunterPayWebhookEventType.TransactionRefunded,
            "transaction.failed" or "transaction.refused" or "transaction.rejected" => HunterPayWebhookEventType.TransactionFailed,
            "transaction.cancelled" or "transaction.canceled" => HunterPayWebhookEventType.TransactionCancelled,
            "withdrawal.created" => HunterPayWebhookEventType.WithdrawalCreated,
            "withdrawal.updated" => HunterPayWebhookEventType.WithdrawalUpdated,
            "withdrawal.done" or "withdrawal.completed" or "withdrawal.paid" => HunterPayWebhookEventType.WithdrawalCompleted,
            "withdrawal.failed" => HunterPayWebhookEventType.WithdrawalFailed,
            "withdrawal.rejected" or "withdrawal.refused" => HunterPayWebhookEventType.WithdrawalRejected,
            "withdrawal.cancelled" or "withdrawal.canceled" => HunterPayWebhookEventType.WithdrawalCancelled,
            _ => HunterPayWebhookEventType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, HunterPayWebhookEventType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            HunterPayWebhookEventType.TransactionCreated => "transaction.created",
            HunterPayWebhookEventType.TransactionUpdated => "transaction.updated",
            HunterPayWebhookEventType.TransactionPaid => "transaction.paid",
            HunterPayWebhookEventType.TransactionRefunded => "transaction.refunded",
            HunterPayWebhookEventType.TransactionFailed => "transaction.failed",
            HunterPayWebhookEventType.TransactionCancelled => "transaction.cancelled",
            HunterPayWebhookEventType.WithdrawalCreated => "withdrawal.created",
            HunterPayWebhookEventType.WithdrawalUpdated => "withdrawal.updated",
            HunterPayWebhookEventType.WithdrawalCompleted => "withdrawal.done",
            HunterPayWebhookEventType.WithdrawalFailed => "withdrawal.failed",
            HunterPayWebhookEventType.WithdrawalRejected => "withdrawal.rejected",
            HunterPayWebhookEventType.WithdrawalCancelled => "withdrawal.cancelled",
            _ => "unknown"
        };

        writer.WriteStringValue(stringValue);
    }
}

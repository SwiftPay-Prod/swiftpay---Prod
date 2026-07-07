using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.IHubBanking.Models.Webhook;

[JsonConverter(typeof(IHubWebhookEventTypeConverter))]
public enum IHubWebhookEventType
{
    Unknown,
    CashInPaid,
    CashInRefunded,
    CashInFailed,
    CashInCancelled,
    CashInExpired,
    CashOutSuccess,
    CashOutFailed,
    CashOutError,
    CashOutRejected,
    CashOutReturned,
    InfractionUpdated
}

public sealed class IHubWebhookEventTypeConverter : JsonConverter<IHubWebhookEventType>
{
    public override IHubWebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return IHubWebhookEventType.Unknown;

        return Normalize(value) switch
        {
            "cashin.paid" => IHubWebhookEventType.CashInPaid,
            "cashin.refunded" => IHubWebhookEventType.CashInRefunded,
            "cashin.failed" => IHubWebhookEventType.CashInFailed,
            "cashin.cancelled" or "cashin.canceled" => IHubWebhookEventType.CashInCancelled,
            "cashin.expired" => IHubWebhookEventType.CashInExpired,
            "cashout.success" => IHubWebhookEventType.CashOutSuccess,
            "cashout.failed" => IHubWebhookEventType.CashOutFailed,
            "cashout.error" => IHubWebhookEventType.CashOutError,
            "cashout.rejected" or "cashout.reject" or "cashout.cancelled" or "cashout.canceled" => IHubWebhookEventType.CashOutRejected,
            "cashout.returned" => IHubWebhookEventType.CashOutReturned,
            "infraction.updated" => IHubWebhookEventType.InfractionUpdated,
            _ => IHubWebhookEventType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, IHubWebhookEventType value, JsonSerializerOptions options)
    {
        var normalized = value switch
        {
            IHubWebhookEventType.CashInPaid => "cashin.paid",
            IHubWebhookEventType.CashInRefunded => "cashin.refunded",
            IHubWebhookEventType.CashInFailed => "cashin.failed",
            IHubWebhookEventType.CashInCancelled => "cashin.cancelled",
            IHubWebhookEventType.CashInExpired => "cashin.expired",
            IHubWebhookEventType.CashOutSuccess => "cashout.success",
            IHubWebhookEventType.CashOutFailed => "cashout.failed",
            IHubWebhookEventType.CashOutError => "cashout.error",
            IHubWebhookEventType.CashOutRejected => "cashout.rejected",
            IHubWebhookEventType.CashOutReturned => "cashout.returned",
            IHubWebhookEventType.InfractionUpdated => "infraction.updated",
            _ => "unknown"
        };

        writer.WriteStringValue(normalized);
    }

    public static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }
}

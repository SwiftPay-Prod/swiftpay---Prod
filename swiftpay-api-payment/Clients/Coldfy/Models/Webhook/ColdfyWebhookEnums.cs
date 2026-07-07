using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Coldfy.Models.Webhook;

[JsonConverter(typeof(ColdfyWebhookObjectTypeConverter))]
public enum ColdfyWebhookObjectType
{
    Unknown,
    Transaction
}

[JsonConverter(typeof(ColdfyWebhookEventTypeConverter))]
public enum ColdfyWebhookEventType
{
    Unknown,
    WithdrawalCompleted,
    WithdrawalFailed
}

public sealed class ColdfyWebhookObjectTypeConverter : JsonConverter<ColdfyWebhookObjectType>
{
    public override ColdfyWebhookObjectType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyWebhookObjectType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "transaction" => ColdfyWebhookObjectType.Transaction,
            _ => ColdfyWebhookObjectType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyWebhookObjectType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyWebhookObjectType.Transaction => "transaction",
            _ => "transaction"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class ColdfyWebhookEventTypeConverter : JsonConverter<ColdfyWebhookEventType>
{
    public override ColdfyWebhookEventType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyWebhookEventType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "withdrawal.completed" => ColdfyWebhookEventType.WithdrawalCompleted,
            "withdrawal.failed" => ColdfyWebhookEventType.WithdrawalFailed,
            _ => ColdfyWebhookEventType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyWebhookEventType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyWebhookEventType.WithdrawalCompleted => "withdrawal.completed",
            ColdfyWebhookEventType.WithdrawalFailed => "withdrawal.failed",
            _ => "withdrawal.completed"
        };

        writer.WriteStringValue(stringValue);
    }
}

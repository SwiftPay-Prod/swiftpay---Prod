using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.HeartPay.Models.Webhook;

[JsonConverter(typeof(HeartPayWebhookTypeConverter))]
public enum HeartPayWebhookType
{
    Unknown,
    Charge,
    Payout
}

public sealed class HeartPayWebhookTypeConverter : JsonConverter<HeartPayWebhookType>
{
    public override HeartPayWebhookType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return HeartPayWebhookType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "charge" or "transaction" or "pix_in" or "pixin" => HeartPayWebhookType.Charge,
            "payout" or "withdraw" or "withdrawal" or "pix_out" or "pixout" => HeartPayWebhookType.Payout,
            _ => HeartPayWebhookType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, HeartPayWebhookType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            HeartPayWebhookType.Charge => "charge",
            HeartPayWebhookType.Payout => "payout",
            _ => "unknown"
        };

        writer.WriteStringValue(stringValue);
    }
}

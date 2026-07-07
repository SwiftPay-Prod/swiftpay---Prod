using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.HunterPay.Models.Webhook;

[JsonConverter(typeof(HunterPayWebhookTypeConverter))]
public enum HunterPayWebhookType
{
    Unknown,
    Transaction,
    Withdrawal
}

public sealed class HunterPayWebhookTypeConverter : JsonConverter<HunterPayWebhookType>
{
    public override HunterPayWebhookType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return HunterPayWebhookType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "transaction" => HunterPayWebhookType.Transaction,
            "withdrawal" => HunterPayWebhookType.Withdrawal,
            _ => HunterPayWebhookType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, HunterPayWebhookType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            HunterPayWebhookType.Transaction => "transaction",
            HunterPayWebhookType.Withdrawal => "withdrawal",
            _ => "unknown"
        };

        writer.WriteStringValue(stringValue);
    }
}

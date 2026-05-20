using System.Text.Json;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.HunterPay.Models.Transactions;

[JsonConverter(typeof(HunterPayTransactionDocumentValueConverter))]
public sealed class HunterPayTransactionDocumentValue
{
    public string? Number { get; init; }
}

public sealed class HunterPayTransactionDocumentValueConverter : JsonConverter<HunterPayTransactionDocumentValue>
{
    public override HunterPayTransactionDocumentValue? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        if (reader.TokenType == JsonTokenType.String)
        {
            var number = reader.GetString();
            return new HunterPayTransactionDocumentValue { Number = number };
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            using var document = JsonDocument.ParseValue(ref reader);
            var root = document.RootElement;

            var number = root.TryGetProperty("number", out var numberProperty)
                && numberProperty.ValueKind == JsonValueKind.String
                ? numberProperty.GetString()
                : null;

            return new HunterPayTransactionDocumentValue { Number = number };
        }

        using var fallback = JsonDocument.ParseValue(ref reader);
        return new HunterPayTransactionDocumentValue
        {
            Number = fallback.RootElement.ToString()
        };
    }

    public override void Write(Utf8JsonWriter writer, HunterPayTransactionDocumentValue value, JsonSerializerOptions options)
    {
        if (string.IsNullOrWhiteSpace(value.Number))
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStartObject();
        writer.WriteString("number", value.Number);
        writer.WriteEndObject();
    }
}

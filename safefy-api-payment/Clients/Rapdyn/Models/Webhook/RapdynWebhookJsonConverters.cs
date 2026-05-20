using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Rapdyn.Models.Webhook;

public sealed class RapdynFlexibleStringConverter : JsonConverter<string?>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.TokenType switch
        {
            JsonTokenType.Null => null,
            JsonTokenType.String => reader.GetString(),
            JsonTokenType.Number => reader.TryGetInt64(out var number)
                ? number.ToString(CultureInfo.InvariantCulture)
                : reader.GetDecimal().ToString(CultureInfo.InvariantCulture),
            JsonTokenType.True => "true",
            JsonTokenType.False => "false",
            _ => throw new JsonException("The JSON value is not in a supported string format.")
        };
    }

    public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(value);
    }
}

public sealed class RapdynWebhookDocumentConverter : JsonConverter<RapdynWebhookDocument?>
{
    public override RapdynWebhookDocument? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
            return null;

        if (reader.TokenType == JsonTokenType.String)
        {
            var value = reader.GetString();
            return string.IsNullOrWhiteSpace(value)
                ? null
                : new RapdynWebhookDocument
                {
                    Type = InferDocumentType(value),
                    Value = value
                };
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            using var document = JsonDocument.ParseValue(ref reader);
            var root = document.RootElement;

            string? type = null;
            string? value = null;

            if (root.TryGetProperty("type", out var typeElement) && typeElement.ValueKind == JsonValueKind.String)
            {
                type = typeElement.GetString();
            }

            if (root.TryGetProperty("value", out var valueElement))
            {
                value = valueElement.ValueKind switch
                {
                    JsonValueKind.String => valueElement.GetString(),
                    JsonValueKind.Number => valueElement.TryGetInt64(out var n)
                        ? n.ToString(CultureInfo.InvariantCulture)
                        : valueElement.GetDecimal().ToString(CultureInfo.InvariantCulture),
                    _ => null
                };
            }

            if (string.IsNullOrWhiteSpace(value))
                return null;

            return new RapdynWebhookDocument
            {
                Type = string.IsNullOrWhiteSpace(type) ? InferDocumentType(value) : type,
                Value = value
            };
        }

        throw new JsonException("The JSON value is not in a supported document format.");
    }

    public override void Write(Utf8JsonWriter writer, RapdynWebhookDocument? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStartObject();
        writer.WriteString("type", value.Type);
        writer.WriteString("value", value.Value);
        writer.WriteEndObject();
    }

    private static string InferDocumentType(string document)
    {
        var digits = new string(document.Where(char.IsDigit).ToArray());
        return digits.Length == 14 ? "CNPJ" : "CPF";
    }
}

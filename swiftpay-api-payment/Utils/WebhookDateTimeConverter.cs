using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Utils;

public sealed class WebhookDateTimeConverter : JsonConverter<DateTime?>
{
    private static readonly string[] SupportedFormats =
    [
        "dd/MM/yyyy HH:mm:ss",
        "dd/MM/yyyy HH:mm",
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd HH:mm:ss.fff",
        "yyyy-MM-ddTHH:mm:ss",
        "yyyy-MM-ddTHH:mm:ss.fff",
        "yyyy-MM-ddTHH:mm:ssK",
        "yyyy-MM-ddTHH:mm:ss.fffK",
        "O"
    ];

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType != JsonTokenType.String)
        {
            return null;
        }

        var value = reader.GetString();
        return ParseNullableDateTime(value);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(NormalizeToUtc(value.Value).ToString("O", CultureInfo.InvariantCulture));
    }

    private static DateTime NormalizeToUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    public static DateTime? ParseNullableDateTime(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (DateTime.TryParseExact(
                value,
                SupportedFormats,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AllowWhiteSpaces,
                out var parsedExact))
        {
            return NormalizeToUtc(parsedExact);
        }

        if (DateTime.TryParse(
                value,
                CultureInfo.GetCultureInfo("pt-BR"),
                DateTimeStyles.AllowWhiteSpaces,
                out var parsedPtBr))
        {
            return NormalizeToUtc(parsedPtBr);
        }

        if (DateTime.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.AllowWhiteSpaces,
                out var parsedInvariant))
        {
            return NormalizeToUtc(parsedInvariant);
        }

        return null;
    }
}

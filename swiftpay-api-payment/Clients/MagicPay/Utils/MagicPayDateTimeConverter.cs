using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.MagicPay.Utils;

public sealed class MagicPayDateTimeConverter : JsonConverter<DateTime?>
{
    private static readonly string[] AllowedFormats =
    [
        "yyyy-MM-dd HH:mm:ss.fffffffzzz",
        "yyyy-MM-dd HH:mm:ss.ffffffzzz",
        "yyyy-MM-dd HH:mm:ss.fffffzzz",
        "yyyy-MM-dd HH:mm:ss.ffffzzz",
        "yyyy-MM-dd HH:mm:ss.fffzzz",
        "yyyy-MM-dd HH:mm:ss.ffzzz",
        "yyyy-MM-dd HH:mm:ss.fzzz",
        "yyyy-MM-dd HH:mm:sszzz",
        "yyyy-MM-dd'T'HH:mm:ss.fffffffK",
        "yyyy-MM-dd'T'HH:mm:ss.ffffffK",
        "yyyy-MM-dd'T'HH:mm:ss.fffffK",
        "yyyy-MM-dd'T'HH:mm:ss.ffffK",
        "yyyy-MM-dd'T'HH:mm:ss.fffK",
        "yyyy-MM-dd'T'HH:mm:ss.ffK",
        "yyyy-MM-dd'T'HH:mm:ss.fK",
        "yyyy-MM-dd'T'HH:mm:ssK"
    ];

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var raw = reader.GetString();
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        if (DateTime.TryParseExact(raw, AllowedFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
            return dt;

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
            return dt;

        return null;
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
            writer.WriteStringValue(value.Value.ToString("yyyy-MM-dd'T'HH:mm:ss.fffK"));
        else
            writer.WriteNullValue();
    }
}

public sealed class MagicPayDateTimeRequiredConverter : JsonConverter<DateTime>
{
    private static readonly MagicPayDateTimeConverter Inner = new();

    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => Inner.Read(ref reader, typeof(DateTime?), options) ?? DateTime.MinValue;

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        => Inner.Write(writer, value, options);
}

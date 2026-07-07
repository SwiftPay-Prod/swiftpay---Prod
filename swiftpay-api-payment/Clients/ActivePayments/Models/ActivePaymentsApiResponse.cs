using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.ActivePayments.Models;

public sealed class ActivePaymentsApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; init; }

    [JsonPropertyName("data")]
    public T? Data { get; init; }

    [JsonPropertyName("error")]
    [JsonConverter(typeof(ActivePaymentsErrorConverter))]
    public ActivePaymentsErrorData? Error { get; init; }

    [JsonPropertyName("statusCode")]
    public int? StatusCode { get; init; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; init; }
}

public sealed class ActivePaymentsErrorData
{
    [JsonPropertyName("code")]
    public string? Code { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("details")]
    public List<ActivePaymentsErrorDetail>? Details { get; init; }

    [JsonPropertyName("retryAfter")]
    public int? RetryAfter { get; init; }
}

public sealed class ActivePaymentsErrorDetail
{
    [JsonPropertyName("field")]
    public string? Field { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }
}

public sealed class ActivePaymentsErrorConverter : JsonConverter<ActivePaymentsErrorData?>
{
    public override ActivePaymentsErrorData? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var errorMessage = reader.GetString();
            return new ActivePaymentsErrorData { Message = errorMessage };
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            return JsonSerializer.Deserialize<ActivePaymentsErrorData>(ref reader, options);
        }

        return null;
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsErrorData? value, JsonSerializerOptions options)
    {
        if (value == null)
        {
            writer.WriteNullValue();
            return;
        }

        JsonSerializer.Serialize(writer, value, options);
    }
}

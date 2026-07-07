using System.Text.Json;
using System.Text.Json.Serialization;
using swiftpay_api_payment.Utils;

namespace swiftpay_api_payment.Clients.Rapdyn.Models.Withdrawals;

[JsonConverter(typeof(RapdynPixKeyTypeConverter))]
public enum RapdynPixKeyType
{
    Unknown,
    Cpf,
    Cnpj,
    Email,
    Phone,
    RandomKey
}

public sealed class RapdynPixKeyTypeConverter : JsonConverter<RapdynPixKeyType>
{
    public override RapdynPixKeyType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynPixKeyType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "cpf" => RapdynPixKeyType.Cpf,
            "cnpj" => RapdynPixKeyType.Cnpj,
            "email" => RapdynPixKeyType.Email,
            "phone" => RapdynPixKeyType.Phone,
            "randomkey" => RapdynPixKeyType.RandomKey,
            _ => RapdynPixKeyType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynPixKeyType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynPixKeyType.Cnpj => "cnpj",
            RapdynPixKeyType.Email => "email",
            RapdynPixKeyType.Phone => "phone",
            RapdynPixKeyType.RandomKey => "randomkey",
            _ => "cpf"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(RapdynTransferStatusConverter))]
public enum RapdynTransferStatus
{
    Unknown,
    Completed,
    Done,
    Failed,
    Canceled,
    Refunded,
    Processing,
    Pending
}

public sealed class RapdynTransferStatusConverter : JsonConverter<RapdynTransferStatus>
{
    public override RapdynTransferStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynTransferStatus.Unknown;

        return value.Trim().ToUpperInvariant() switch
        {
            "COMPLETED" => RapdynTransferStatus.Completed,
            "DONE" => RapdynTransferStatus.Done,
            "FAILED" => RapdynTransferStatus.Failed,
            "CANCELED" => RapdynTransferStatus.Canceled,
            "CANCELLED" => RapdynTransferStatus.Canceled,
            "REFUNDED" => RapdynTransferStatus.Refunded,
            "PROCESSING" => RapdynTransferStatus.Processing,
            "PENDING" => RapdynTransferStatus.Pending,
            _ => RapdynTransferStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynTransferStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynTransferStatus.Completed => "COMPLETED",
            RapdynTransferStatus.Done => "DONE",
            RapdynTransferStatus.Failed => "FAILED",
            RapdynTransferStatus.Canceled => "CANCELED",
            RapdynTransferStatus.Refunded => "REFUNDED",
            RapdynTransferStatus.Processing => "PROCESSING",
            RapdynTransferStatus.Pending => "PENDING",
            _ => "PENDING"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class RapdynCreateTransferRequest
{
    [JsonPropertyName("pix_key_type")]
    public RapdynPixKeyType PixKeyType { get; init; } = RapdynPixKeyType.Cpf;

    [JsonPropertyName("pix_key")]
    public string PixKey { get; init; } = string.Empty;

    [JsonPropertyName("value")]
    public long Value { get; init; }
}

public sealed class RapdynTransferResponse
{
    [JsonPropertyName("transfer_id")]
    public string? TransferId { get; init; }

    [JsonPropertyName("value")]
    public string? Value { get; init; }

    [JsonPropertyName("tax")]
    public string? Tax { get; init; }

    [JsonPropertyName("pix_key_type")]
    public RapdynPixKeyType? PixKeyType { get; init; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; init; }

    [JsonPropertyName("status")]
    public RapdynTransferStatus? Status { get; init; }

    [JsonPropertyName("dates")]
    public RapdynTransferDates? Dates { get; init; }
}

public sealed class RapdynTransferDates
{
    [JsonPropertyName("started_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? StartedAt { get; init; }

    [JsonPropertyName("completed_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? CompletedAt { get; init; }
}

using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.Pluggou.Models.Withdrawals;

[JsonConverter(typeof(PluggouPixKeyTypeConverter))]
public enum PluggouPixKeyType
{
    Unknown,
    Cpf,
    Cnpj,
    Email,
    Phone,
    Random
}

public sealed class PluggouPixKeyTypeConverter : JsonConverter<PluggouPixKeyType>
{
    public override PluggouPixKeyType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return PluggouPixKeyType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "cpf" => PluggouPixKeyType.Cpf,
            "cnpj" => PluggouPixKeyType.Cnpj,
            "email" => PluggouPixKeyType.Email,
            "phone" => PluggouPixKeyType.Phone,
            "random" => PluggouPixKeyType.Random,
            "evp" => PluggouPixKeyType.Random,
            _ => PluggouPixKeyType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, PluggouPixKeyType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            PluggouPixKeyType.Cpf => "cpf",
            PluggouPixKeyType.Cnpj => "cnpj",
            PluggouPixKeyType.Email => "email",
            PluggouPixKeyType.Phone => "phone",
            PluggouPixKeyType.Random => "random",
            _ => "cpf"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(PluggouWithdrawalStatusConverter))]
public enum PluggouWithdrawalStatus
{
    Unknown,
    Pending,
    Approved,
    Paid,
    Failed,
    Canceled,
    Refunded
}

public sealed class PluggouWithdrawalStatusConverter : JsonConverter<PluggouWithdrawalStatus>
{
    public override PluggouWithdrawalStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return PluggouWithdrawalStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => PluggouWithdrawalStatus.Pending,
            "approved" => PluggouWithdrawalStatus.Approved,
            "paid" => PluggouWithdrawalStatus.Paid,
            "failed" => PluggouWithdrawalStatus.Failed,
            "canceled" => PluggouWithdrawalStatus.Canceled,
            "cancelled" => PluggouWithdrawalStatus.Canceled,
            "refunded" => PluggouWithdrawalStatus.Refunded,
            _ => PluggouWithdrawalStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, PluggouWithdrawalStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            PluggouWithdrawalStatus.Pending => "pending",
            PluggouWithdrawalStatus.Approved => "approved",
            PluggouWithdrawalStatus.Paid => "paid",
            PluggouWithdrawalStatus.Failed => "failed",
            PluggouWithdrawalStatus.Canceled => "canceled",
            PluggouWithdrawalStatus.Refunded => "refunded",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class PluggouCreateWithdrawalRequest
{
    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("key_type")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public PluggouPixKeyType? KeyType { get; init; }

    [JsonPropertyName("key_value")]
    public string KeyValue { get; init; } = string.Empty;
}

public sealed class PluggouWithdrawalData
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("e2e_id")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("liquid_amount")]
    public long? LiquidAmount { get; init; }

    [JsonPropertyName("pix_type")]
    public PluggouPixKeyType? PixType { get; init; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; init; }

    [JsonPropertyName("status")]
    public PluggouWithdrawalStatus? Status { get; init; }

    [JsonPropertyName("paid_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("created_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? CreatedAt { get; init; }
}

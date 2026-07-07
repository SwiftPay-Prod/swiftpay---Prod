using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.Withdrawals;

[JsonConverter(typeof(ActivePaymentsPixKeyTypeConverter))]
public enum ActivePaymentsPixKeyType
{
    Unknown,
    Cpf,
    Cnpj,
    Email,
    Phone,
    Evp,
    Random
}

public sealed class ActivePaymentsPixKeyTypeConverter : JsonConverter<ActivePaymentsPixKeyType>
{
    public override ActivePaymentsPixKeyType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ActivePaymentsPixKeyType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "cpf" => ActivePaymentsPixKeyType.Cpf,
            "cnpj" => ActivePaymentsPixKeyType.Cnpj,
            "email" => ActivePaymentsPixKeyType.Email,
            "phone" => ActivePaymentsPixKeyType.Phone,
            "evp" => ActivePaymentsPixKeyType.Evp,
            "random" => ActivePaymentsPixKeyType.Random,
            _ => ActivePaymentsPixKeyType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsPixKeyType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ActivePaymentsPixKeyType.Cnpj => "cnpj",
            ActivePaymentsPixKeyType.Email => "email",
            ActivePaymentsPixKeyType.Phone => "phone",
            ActivePaymentsPixKeyType.Evp => "evp",
            ActivePaymentsPixKeyType.Random => "random",
            _ => "cpf"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(ActivePaymentsWithdrawalStatusConverter))]
public enum ActivePaymentsWithdrawalStatus
{
    Unknown,
    Pending,
    Processing,
    Completed,
    Done,
    Failed,
    Rejected
}

public sealed class ActivePaymentsWithdrawalStatusConverter : JsonConverter<ActivePaymentsWithdrawalStatus>
{
    public override ActivePaymentsWithdrawalStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ActivePaymentsWithdrawalStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => ActivePaymentsWithdrawalStatus.Pending,
            "processing" => ActivePaymentsWithdrawalStatus.Processing,
            "completed" => ActivePaymentsWithdrawalStatus.Completed,
            "done" => ActivePaymentsWithdrawalStatus.Done,
            "failed" => ActivePaymentsWithdrawalStatus.Failed,
            "rejected" => ActivePaymentsWithdrawalStatus.Rejected,
            _ => ActivePaymentsWithdrawalStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsWithdrawalStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ActivePaymentsWithdrawalStatus.Completed => "completed",
            ActivePaymentsWithdrawalStatus.Done => "done",
            ActivePaymentsWithdrawalStatus.Failed => "failed",
            ActivePaymentsWithdrawalStatus.Rejected => "rejected",
            ActivePaymentsWithdrawalStatus.Processing => "processing",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class ActivePaymentsWithdrawRequest
{
    [JsonPropertyName("amount")]
    public required decimal Amount { get; init; }

    [JsonPropertyName("pixKey")]
    public required string PixKey { get; init; }

    [JsonPropertyName("pixKeyType")]
    public required ActivePaymentsPixKeyType PixKeyType { get; init; }

    [JsonPropertyName("externalReference")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? ExternalReference { get; init; }

    [JsonPropertyName("postbackUrl")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? PostbackUrl { get; init; }
}

public sealed class ActivePaymentsWithdrawResponse
{
    [JsonPropertyName("withdrawalId")]
    public string? WithdrawalId { get; init; }

    [JsonPropertyName("amount")]
    public string? Amount { get; init; }

    [JsonPropertyName("fee")]
    public string? Fee { get; init; }

    [JsonPropertyName("netAmount")]
    public string? NetAmount { get; init; }

    [JsonPropertyName("status")]
    public ActivePaymentsWithdrawalStatus? Status { get; init; }

    [JsonPropertyName("pixKey")]
    public string? PixKey { get; init; }

    [JsonPropertyName("pixKeyType")]
    public ActivePaymentsPixKeyType? PixKeyType { get; init; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }
}

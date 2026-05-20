using System.Text.Json.Serialization;
using safefy_api_payment.Clients.Coldfy.Utils;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.Coldfy.Models.Withdrawals;

[JsonConverter(typeof(ColdfyPixKeyTypeConverter))]
public enum ColdfyPixKeyType
{
    Unknown,
    Cpf,
    Cnpj,
    Email,
    Phone,
    Evp
}

[JsonConverter(typeof(ColdfyWithdrawalStatusConverter))]
public enum ColdfyWithdrawalStatus
{
    Unknown,
    Pending,
    Approved,
    Paid,
    Failed,
    Canceled
}

public sealed class ColdfyCreateWithdrawalRequest
{
    [JsonPropertyName("pixkeyid")]
    public string? PixKeyId { get; init; }

    [JsonPropertyName("pixkeytype")]
    public ColdfyPixKeyType? PixKeyType { get; init; }

    [JsonPropertyName("pixkey")]
    public string? PixKey { get; init; }

    [JsonPropertyName("requestedamount")]
    public long RequestedAmount { get; init; }

    [JsonPropertyName("description")]
    public string Description { get; init; } = string.Empty;

    [JsonPropertyName("isPix")]
    public bool IsPix { get; init; } = true;

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }
}

public sealed class ColdfyWithdrawalResponse
{
    [JsonPropertyName("event")]
    public string? Event { get; init; }

    [JsonPropertyName("timestamp")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? Timestamp { get; init; }

    [JsonPropertyName("withdrawal")]
    public ColdfyWithdrawal? Withdrawal { get; init; }

    [JsonPropertyName("metadata")]
    public ColdfyResponseMetadata? Metadata { get; init; }
}

public sealed class ColdfyWithdrawal
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("company_id")]
    public string? CompanyId { get; init; }

    [JsonPropertyName("requested_amount")]
    public decimal? RequestedAmount { get; init; }

    [JsonPropertyName("currency")]
    public string? Currency { get; init; }

    [JsonPropertyName("status")]
    public ColdfyWithdrawalStatus? Status { get; init; }

    [JsonPropertyName("created_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("updated_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? UpdatedAt { get; init; }

    [JsonPropertyName("paid_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("pix")]
    public ColdfyWithdrawalPix? Pix { get; init; }

    [JsonPropertyName("fee")]
    public decimal? Fee { get; init; }

    [JsonPropertyName("net_amount")]
    public decimal? NetAmount { get; init; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
}

public sealed class ColdfyWithdrawalPix
{
    [JsonPropertyName("key_type")]
    public ColdfyPixKeyType? KeyType { get; init; }

    [JsonPropertyName("key_value")]
    public string? KeyValue { get; init; }

    [JsonPropertyName("end_to_end_id")]
    public string? EndToEndId { get; init; }
}

public sealed class ColdfyResponseMetadata
{
    [JsonPropertyName("source")]
    public string? Source { get; init; }

    [JsonPropertyName("version")]
    public string? Version { get; init; }
}

public sealed class ColdfyWithdrawalErrorResponse
{
    [JsonPropertyName("success")]
    public bool? Success { get; init; }

    [JsonPropertyName("error")]
    public ColdfyWithdrawalError? Error { get; init; }
}

public sealed class ColdfyWithdrawalError
{
    [JsonPropertyName("code")]
    public int? Code { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; init; }
}

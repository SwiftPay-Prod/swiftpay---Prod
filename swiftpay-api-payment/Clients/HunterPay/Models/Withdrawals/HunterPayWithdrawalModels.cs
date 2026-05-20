using System.Text.Json.Serialization;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.HunterPay.Models.Withdrawals;

public sealed class HunterPayCreateWithdrawalRequest
{
    [JsonPropertyName("pixkeyid")]
    public string? PixKeyId { get; init; }

    [JsonPropertyName("pixkeytype")]
    public string? PixKeyType { get; init; }

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

public sealed class HunterPayWithdrawalResponse
{
    [JsonPropertyName("event")]
    public string? Event { get; init; }

    [JsonPropertyName("timestamp")]
    public string? TimestampRaw { get; init; }

    [JsonIgnore]
    public DateTime? Timestamp => WebhookDateTimeConverter.ParseNullableDateTime(TimestampRaw);

    [JsonPropertyName("withdrawal")]
    public HunterPayWithdrawal? Withdrawal { get; init; }

    [JsonPropertyName("metadata")]
    public HunterPayWithdrawalMetadata? Metadata { get; init; }
}

public sealed class HunterPayWithdrawal
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
    public string? Status { get; init; }

    [JsonPropertyName("created_at")]
    public string? CreatedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? CreatedAt => WebhookDateTimeConverter.ParseNullableDateTime(CreatedAtRaw);

    [JsonPropertyName("updated_at")]
    public string? UpdatedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? UpdatedAt => WebhookDateTimeConverter.ParseNullableDateTime(UpdatedAtRaw);

    [JsonPropertyName("paid_at")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    [JsonPropertyName("pix")]
    public HunterPayWithdrawalPix? Pix { get; init; }

    [JsonPropertyName("fee")]
    public decimal? Fee { get; init; }

    [JsonPropertyName("net_amount")]
    public decimal? NetAmount { get; init; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
}

public sealed class HunterPayWithdrawalPix
{
    [JsonPropertyName("key_type")]
    public string? KeyType { get; init; }

    [JsonPropertyName("key_value")]
    public string? KeyValue { get; init; }

    [JsonPropertyName("end_to_end_id")]
    public string? EndToEndId { get; init; }
}

public sealed class HunterPayWithdrawalMetadata
{
    [JsonPropertyName("source")]
    public string? Source { get; init; }

    [JsonPropertyName("version")]
    public string? Version { get; init; }
}

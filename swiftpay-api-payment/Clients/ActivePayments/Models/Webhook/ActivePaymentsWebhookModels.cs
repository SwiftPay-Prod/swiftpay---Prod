using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateCharge;
using swiftpay_api_payment.Clients.ActivePayments.Models.Withdrawals;
using swiftpay_api_payment.Utils;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.Webhook;

[JsonConverter(typeof(ActivePaymentsWebhookRequestConverter))]
public sealed class ActivePaymentsWebhookRequest
{
    public ActivePaymentsWebhookEventType Event { get; init; }
    public string? TimestampRaw { get; init; }

    [JsonIgnore]
    public DateTime? Timestamp => WebhookDateTimeConverter.ParseNullableDateTime(TimestampRaw);

    public ActivePaymentsChargeWebhookData? Charge { get; init; }
    public ActivePaymentsWithdrawWebhookData? Withdrawal { get; init; }
}

public sealed class ActivePaymentsWebhookResponse
{
    [JsonPropertyName("received")]
    public bool Received { get; init; }
}

public sealed class ActivePaymentsChargeWebhookData
{
    [JsonPropertyName("chargeId")]
    public string? ChargeId { get; init; }

    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("externalReference")]
    public string? ExternalReference { get; init; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; init; }

    [JsonPropertyName("netAmount")]
    public decimal NetAmount { get; init; }

    [JsonPropertyName("fee")]
    public decimal Fee { get; init; }

    [JsonPropertyName("status")]
    public ActivePaymentsChargeStatus? Status { get; init; }

    [JsonPropertyName("method")]
    public ActivePaymentsPaymentMethod? Method { get; init; }

    [JsonPropertyName("endToEnd")]
    public string? EndToEnd { get; init; }

    [JsonPropertyName("customer")]
    public ActivePaymentsWebhookCustomer? Customer { get; init; }

    [JsonPropertyName("paidAt")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);
}

public sealed class ActivePaymentsWebhookCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("cpf")]
    public string? Cpf { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }
}

public sealed class ActivePaymentsWithdrawWebhookData
{
    [JsonPropertyName("withdrawalId")]
    public string? WithdrawalId { get; init; }

    [JsonPropertyName("externalReference")]
    public string? ExternalReference { get; init; }

    [JsonPropertyName("amount")]
    public decimal Amount { get; init; }

    [JsonPropertyName("fee")]
    public decimal Fee { get; init; }

    [JsonPropertyName("netAmount")]
    public decimal NetAmount { get; init; }

    [JsonPropertyName("status")]
    public ActivePaymentsWithdrawalStatus? Status { get; init; }

    [JsonPropertyName("pixKey")]
    public string? PixKey { get; init; }

    [JsonPropertyName("pixKeyType")]
    public ActivePaymentsPixKeyType? PixKeyType { get; init; }

    [JsonPropertyName("endToEnd")]
    public string? EndToEnd { get; init; }

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; init; }

    [JsonPropertyName("completedAt")]
    public string? CompletedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? CompletedAt => WebhookDateTimeConverter.ParseNullableDateTime(CompletedAtRaw);

    [JsonPropertyName("processedAt")]
    public string? ProcessedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? ProcessedAt => WebhookDateTimeConverter.ParseNullableDateTime(ProcessedAtRaw);
}

using System.Text.Json.Serialization;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Clients.IHubBanking.Models.Webhook;

public sealed record IHubWebhookRequest
{
    [JsonPropertyName("event")]
    public required IHubWebhookEventType Event { get; init; }

    [JsonPropertyName("payload")]
    public required IHubWebhookPayloadData Payload { get; init; }
}

public sealed class IHubWebhookResponse : BaseResponse<IHubWebhookData> { }

public sealed class IHubWebhookData
{
    public bool Processed { get; set; }
}

public sealed record IHubWebhookPayloadData
{
    [JsonPropertyName("transaction_id")]
    public string? TransactionId { get; init; }

    [JsonPropertyName("withdrawal_id")]
    public string? WithdrawalId { get; init; }

    [JsonPropertyName("external_id")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("end_to_end_id")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("payer")]
    public IHubWebhookPartyInfo? Payer { get; init; }

    [JsonPropertyName("receiver")]
    public IHubWebhookPartyInfo? Receiver { get; init; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; init; }
}

public sealed record IHubWebhookPartyInfo
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("document")]
    public string? Document { get; init; }

    [JsonPropertyName("ispb")]
    public string? Ispb { get; init; }

    [JsonPropertyName("institution")]
    public string? Institution { get; init; }
}

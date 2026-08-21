using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.PixHub.Models;

public sealed class PixHubWebhookPayerInfo
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }
}

public sealed class PixHubWebhookPixDetails
{
    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; set; }

    [JsonPropertyName("payerInfo")]
    public PixHubWebhookPayerInfo? PayerInfo { get; set; }

    [JsonPropertyName("creditorAccount")]
    public PixHubWebhookPayerInfo? CreditorAccount { get; set; }
}

public sealed class PixHubWebhookTransaction
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("pix")]
    public PixHubWebhookPixDetails? Pix { get; set; }
}

public sealed class PixHubWebhookTransfer
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("pix")]
    public PixHubWebhookPixDetails? Pix { get; set; }
}

public sealed class PixHubWebhookPayload
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("type")]
    public string? Type { get; set; } // "transaction" or "transfer"

    [JsonPropertyName("event")]
    public string? Event { get; set; } // "transaction_paid", "transfer_completed", etc.

    [JsonPropertyName("scope")]
    public string? Scope { get; set; }

    [JsonPropertyName("transaction")]
    public PixHubWebhookTransaction? Transaction { get; set; }

    [JsonPropertyName("transfer")]
    public PixHubWebhookTransfer? Transfer { get; set; }
}

using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Endpoints.Acquirers.FlevoPay.Webhook;

public class FlevoPayTransactionWebhookRequest
{
    [JsonPropertyName("transaction_id")]
    public object? TransactionId { get; set; }

    [JsonPropertyName("external_id")]
    public string? ExternalId { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("customer")]
    public FlevoPayWebhookCustomer? Customer { get; set; }

    [JsonPropertyName("pix_code")]
    public string? PixCode { get; set; }

    [JsonPropertyName("raw_status")]
    public string? RawStatus { get; set; }

    [JsonPropertyName("webhook_type")]
    public string? WebhookType { get; set; }

    [JsonPropertyName("timestamp")]
    public string? Timestamp { get; set; }

    [JsonPropertyName("recurring_id")]
    public string? RecurringId { get; set; }
}

public class FlevoPayWebhookCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
}
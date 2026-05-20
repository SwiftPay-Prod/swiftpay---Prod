using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.Webhook;

public sealed class AccithusWebhookTransactionData
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public long? Amount { get; set; }

    [JsonPropertyName("paid_amount")]
    public long? PaidAmount { get; set; }

    [JsonPropertyName("payment_method")]
    public string? PaymentMethod { get; set; }

    [JsonPropertyName("tx_id")]
    public string? TxId { get; set; }

    [JsonPropertyName("end_to_end_id")]
    public string? EndToEndId { get; set; }

    [JsonPropertyName("payer_name")]
    public string? PayerName { get; set; }

    [JsonPropertyName("payer_document")]
    public string? PayerDocument { get; set; }

    [JsonPropertyName("payer_bank")]
    public string? PayerBank { get; set; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; set; }

    [JsonPropertyName("refunded_amount")]
    public long? RefundedAmount { get; set; }

    [JsonPropertyName("paid_at")]
    public string? PaidAt { get; set; }

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

public sealed class AccithusWebhookWithdrawalData
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public long? Amount { get; set; }

    [JsonPropertyName("pix_key")]
    public string? PixKey { get; set; }

    [JsonPropertyName("pix_key_type")]
    public string? PixKeyType { get; set; }

    [JsonPropertyName("tx_id")]
    public string? TxId { get; set; }

    [JsonPropertyName("end_to_end_id")]
    public string? EndToEndId { get; set; }

    [JsonPropertyName("receiver_name")]
    public string? ReceiverName { get; set; }

    [JsonPropertyName("receiver_document")]
    public string? ReceiverDocument { get; set; }

    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; set; }

    [JsonPropertyName("completed_at")]
    public string? CompletedAt { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }
}

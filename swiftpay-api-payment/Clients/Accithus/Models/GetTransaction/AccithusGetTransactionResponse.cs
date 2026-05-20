using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.GetTransaction;

public sealed class AccithusGetTransactionResponse
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

    [JsonPropertyName("paid_at")]
    public string? PaidAt { get; set; }

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

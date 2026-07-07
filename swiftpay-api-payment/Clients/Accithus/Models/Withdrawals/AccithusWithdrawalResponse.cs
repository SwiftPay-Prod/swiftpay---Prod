using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Accithus.Models.Withdrawals;

public sealed class AccithusWithdrawResponse
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

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }
}

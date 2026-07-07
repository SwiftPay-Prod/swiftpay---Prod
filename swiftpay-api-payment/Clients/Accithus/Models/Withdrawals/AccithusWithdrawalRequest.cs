using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Accithus.Models.Withdrawals;

public sealed class AccithusWithdrawRequest
{
    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("pix_key")]
    public string PixKey { get; set; } = string.Empty;

    [JsonPropertyName("pix_key_type")]
    public string PixKeyType { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("callback_url")]
    public string? CallbackUrl { get; set; }
}

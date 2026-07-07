using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Accithus.Models.Submerchant;

public sealed class AccithusUpdateSubmerchantRequest
{
    [JsonPropertyName("legal_name")]
    public string? LegalName { get; set; }

    [JsonPropertyName("trade_name")]
    public string? TradeName { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("website")]
    public string? Website { get; set; }
}

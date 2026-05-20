using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.Submerchant;

public sealed class AccithusSubmerchantResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("legal_name")]
    public string? LegalName { get; set; }

    [JsonPropertyName("entity_type")]
    public string? DocumentType { get; set; }

    [JsonPropertyName("tax_id")]
    public string? DocumentNumber { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }

    [JsonPropertyName("rejection_reason")]
    public string? RejectionReason { get; set; }

    [JsonPropertyName("status_reason")]
    public string? StatusReason { get; set; }
}

using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.Submerchant;

public sealed class AccithusUpsertSubmerchantSplitConfigRequest
{
    [JsonPropertyName("commission_type")]
    public string CommissionType { get; set; } = string.Empty;

    [JsonPropertyName("commission_value")]
    public decimal CommissionValue { get; set; }

    [JsonPropertyName("is_active")]
    public bool IsActive { get; set; } = true;
}

public sealed class AccithusSubmerchantSplitConfigResponse
{
    [JsonPropertyName("submerchant_id")]
    public string? SubmerchantId { get; set; }

    [JsonPropertyName("commission_type")]
    public string? CommissionType { get; set; }

    [JsonPropertyName("commission_value")]
    public decimal? CommissionValue { get; set; }

    [JsonPropertyName("is_active")]
    public bool? IsActive { get; set; }
}
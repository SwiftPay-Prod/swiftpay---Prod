using System.Text.Json.Serialization;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Integrations;

namespace swiftpay_api.Endpoints.Merchants.Integrations.ReadIntegrations;

public sealed class ReadIntegrationsRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadIntegrationsResponse : BaseResponse<ReadIntegrationsData>;

public sealed class ReadIntegrationsData
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantIntegrationType Type { get; set; }

    public List<MerchantIntegrationListItem> Items { get; set; } = [];
}

public sealed class MerchantIntegrationListItem
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantIntegrationProvider Provider { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public bool IsEnabled { get; set; }
    public bool IsConfigured { get; set; }
    public Dictionary<string, string> ConfigValues { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public List<MerchantIntegrationConfigFieldData> ConfigFields { get; set; } = [];
    public bool IsAvailable { get; set; }
    public bool WaitingPaymentEnabled { get; set; }
    public bool PaidEnabled { get; set; }
    public bool RefusedEnabled { get; set; }
    public bool RefundedEnabled { get; set; }
    public bool ChargedbackEnabled { get; set; }
}

public sealed class MerchantIntegrationConfigFieldData
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public MerchantIntegrationFieldType Type { get; set; }

    public bool IsRequired { get; set; }
    public string? Placeholder { get; set; }
    public string? Description { get; set; }
}

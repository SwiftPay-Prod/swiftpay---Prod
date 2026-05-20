using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Integrations;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantIntegrationProvider
{
    Utmify,
    Otimizey,
    FacebookCapi
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantIntegrationType
{
    Tracking
}

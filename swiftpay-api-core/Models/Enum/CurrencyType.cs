using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CurrencyType
{
    BRL
}
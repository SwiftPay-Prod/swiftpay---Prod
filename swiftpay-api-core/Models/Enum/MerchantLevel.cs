using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantLevel
{
    Iron = 0,
    Bronze = 1,
    Silver = 2,
    GoldStart = 3,
    GoldPro = 4,
    Diamond = 5,
    PlatinumStart = 6,
    PlatinumPro = 7,
    Titanium = 8,
    Black = 9,
    Legend = 10
}

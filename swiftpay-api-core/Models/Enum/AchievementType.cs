using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AchievementType
{
    VolumeThreshold = 1,
    FirstSell = 2,
    FirstCheckout = 3
}

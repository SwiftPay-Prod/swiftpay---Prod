using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutProcessingStatus
{
    Processing,
    Completed,
    Failed
}

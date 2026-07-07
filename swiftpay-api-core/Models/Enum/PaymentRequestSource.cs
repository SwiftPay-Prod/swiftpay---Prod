using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentRequestSource
{
    Api,
    Checkout,
    PaymentLink
}

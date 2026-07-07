using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Enum;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UploadFolder
{
    Merchants,
    Kyc,
    Products,
    Checkouts,
    Avatars,
    Templates,
    Acquirers,
    ReferralCommissions,
    PaymentLinks
}

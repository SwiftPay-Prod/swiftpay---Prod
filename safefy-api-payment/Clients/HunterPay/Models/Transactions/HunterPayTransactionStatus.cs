using System.Text.Json;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.HunterPay.Models.Transactions;

[JsonConverter(typeof(HunterPayTransactionStatusConverter))]
public enum HunterPayTransactionStatus
{
    Unknown,
    WaitingPayment,
    Processing,
    Authorized,
    Paid,
    Refunded,
    Chargedback,
    Canceled,
    Refused,
    InProtest,
    PartiallyPaid
}

public sealed class HunterPayTransactionStatusConverter : JsonConverter<HunterPayTransactionStatus>
{
    public override HunterPayTransactionStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return HunterPayTransactionStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "waiting_payment" => HunterPayTransactionStatus.WaitingPayment,
            "processing" => HunterPayTransactionStatus.Processing,
            "authorized" => HunterPayTransactionStatus.Authorized,
            "paid" => HunterPayTransactionStatus.Paid,
            "refunded" => HunterPayTransactionStatus.Refunded,
            "chargedback" => HunterPayTransactionStatus.Chargedback,
            "canceled" or "cancelled" => HunterPayTransactionStatus.Canceled,
            "refused" => HunterPayTransactionStatus.Refused,
            "in_protest" => HunterPayTransactionStatus.InProtest,
            "partially_paid" => HunterPayTransactionStatus.PartiallyPaid,
            _ => HunterPayTransactionStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, HunterPayTransactionStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            HunterPayTransactionStatus.WaitingPayment => "waiting_payment",
            HunterPayTransactionStatus.Processing => "processing",
            HunterPayTransactionStatus.Authorized => "authorized",
            HunterPayTransactionStatus.Paid => "paid",
            HunterPayTransactionStatus.Refunded => "refunded",
            HunterPayTransactionStatus.Chargedback => "chargedback",
            HunterPayTransactionStatus.Canceled => "canceled",
            HunterPayTransactionStatus.Refused => "refused",
            HunterPayTransactionStatus.InProtest => "in_protest",
            HunterPayTransactionStatus.PartiallyPaid => "partially_paid",
            _ => "unknown"
        };

        writer.WriteStringValue(stringValue);
    }
}

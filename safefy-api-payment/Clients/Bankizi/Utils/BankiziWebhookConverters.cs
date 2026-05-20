using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_payment.Clients.Bankizi.Models.Webhook;

namespace safefy_api_payment.Clients.Bankizi.Utils;

/// <summary>
/// Converter customizado para BankiziPixStatus que aceita UPPERCASE ou PascalCase.
/// Exemplo: "PAID", "Paid", "paid" -> BankiziPixStatus.Paid
/// </summary>
public sealed class BankiziPixStatusConverter : JsonConverter<BankiziPixStatus>
{
    public override BankiziPixStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
            return BankiziPixStatus.Generated;

        // Normaliza para comparação case-insensitive
        return value.ToUpperInvariant() switch
        {
            "GENERATED" => BankiziPixStatus.Generated,
            "PAID" => BankiziPixStatus.Paid,
            "REQUESTED_REFUND" or "REQUESTEDREFUND" => BankiziPixStatus.RequestedRefund,
            "REFUNDED" => BankiziPixStatus.Refunded,
            "PARTIALLY_REFUNDED" or "PARTIALLYREFUNDED" => BankiziPixStatus.PartiallyRefunded,
            "EXPIRED" => BankiziPixStatus.Expired,
            "CANCELLED" or "CANCELED" => BankiziPixStatus.Cancelled,
            _ => throw new JsonException($"Unknown BankiziPixStatus: {value}")
        };
    }

    public override void Write(Utf8JsonWriter writer, BankiziPixStatus value, JsonSerializerOptions options)
    {
        // Escreve em UPPERCASE para manter compatibilidade com Bankizi
        var stringValue = value switch
        {
            BankiziPixStatus.Generated => "GENERATED",
            BankiziPixStatus.Paid => "PAID",
            BankiziPixStatus.RequestedRefund => "REQUESTED_REFUND",
            BankiziPixStatus.Refunded => "REFUNDED",
            BankiziPixStatus.PartiallyRefunded => "PARTIALLY_REFUNDED",
            BankiziPixStatus.Expired => "EXPIRED",
            BankiziPixStatus.Cancelled => "CANCELLED",
            _ => value.ToString().ToUpperInvariant()
        };
        writer.WriteStringValue(stringValue);
    }
}

/// <summary>
/// Converter customizado para BankiziPixOutStatus que aceita UPPERCASE ou PascalCase.
/// Exemplo: "DONE", "Done", "done" -> BankiziPixOutStatus.Done
/// </summary>
public sealed class BankiziPixOutStatusConverter : JsonConverter<BankiziPixOutStatus>
{
    public override BankiziPixOutStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrEmpty(value))
            return BankiziPixOutStatus.Generated;

        return value.ToUpperInvariant() switch
        {
            "GENERATED" => BankiziPixOutStatus.Generated,
            "DONE" => BankiziPixOutStatus.Done,
            "FAILED" => BankiziPixOutStatus.Failed,
            "REJECT" or "REJECTED" => BankiziPixOutStatus.Reject,
            "REFUNDED" => BankiziPixOutStatus.Refunded,
            "PARTIALLY_REFUNDED" or "PARTIALLYREFUNDED" => BankiziPixOutStatus.PartiallyRefunded,
            _ => throw new JsonException($"Unknown BankiziPixOutStatus: {value}")
        };
    }

    public override void Write(Utf8JsonWriter writer, BankiziPixOutStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            BankiziPixOutStatus.Generated => "GENERATED",
            BankiziPixOutStatus.Done => "DONE",
            BankiziPixOutStatus.Failed => "FAILED",
            BankiziPixOutStatus.Reject => "REJECT",
            BankiziPixOutStatus.Refunded => "REFUNDED",
            BankiziPixOutStatus.PartiallyRefunded => "PARTIALLY_REFUNDED",
            _ => value.ToString().ToUpperInvariant()
        };
        writer.WriteStringValue(stringValue);
    }
}

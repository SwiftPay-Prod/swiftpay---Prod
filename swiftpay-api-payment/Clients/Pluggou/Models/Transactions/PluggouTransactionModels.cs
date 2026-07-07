using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Pluggou.Models.Transactions;

[JsonConverter(typeof(PluggouPaymentMethodConverter))]
public enum PluggouPaymentMethod
{
    Unknown,
    Pix
}

public sealed class PluggouPaymentMethodConverter : JsonConverter<PluggouPaymentMethod>
{
    public override PluggouPaymentMethod Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return PluggouPaymentMethod.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pix" => PluggouPaymentMethod.Pix,
            _ => PluggouPaymentMethod.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, PluggouPaymentMethod value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            PluggouPaymentMethod.Pix => "pix",
            _ => "pix"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(PluggouTransactionStatusConverter))]
public enum PluggouTransactionStatus
{
    Unknown,
    Pending,
    Paid,
    Failed,
    Canceled,
    Refunded,
    Chargeback
}

public sealed class PluggouTransactionStatusConverter : JsonConverter<PluggouTransactionStatus>
{
    public override PluggouTransactionStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return PluggouTransactionStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => PluggouTransactionStatus.Pending,
            "paid" => PluggouTransactionStatus.Paid,
            "failed" => PluggouTransactionStatus.Failed,
            "canceled" => PluggouTransactionStatus.Canceled,
            "cancelled" => PluggouTransactionStatus.Canceled,
            "refunded" => PluggouTransactionStatus.Refunded,
            "chargeback" => PluggouTransactionStatus.Chargeback,
            _ => PluggouTransactionStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, PluggouTransactionStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            PluggouTransactionStatus.Pending => "pending",
            PluggouTransactionStatus.Paid => "paid",
            PluggouTransactionStatus.Failed => "failed",
            PluggouTransactionStatus.Canceled => "canceled",
            PluggouTransactionStatus.Refunded => "refunded",
            PluggouTransactionStatus.Chargeback => "chargeback",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class PluggouCreateTransactionRequest
{
    [JsonPropertyName("payment_method")]
    public PluggouPaymentMethod PaymentMethod { get; init; } = PluggouPaymentMethod.Pix;

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("buyer")]
    public PluggouTransactionBuyer Buyer { get; init; } = new();
}

public sealed class PluggouTransactionBuyer
{
    [JsonPropertyName("buyer_name")]
    public string BuyerName { get; init; } = string.Empty;

    [JsonPropertyName("buyer_document")]
    public string BuyerDocument { get; init; } = string.Empty;

    [JsonPropertyName("buyer_phone")]
    public string BuyerPhone { get; init; } = string.Empty;

    [JsonPropertyName("buyer_email")]
    public string? BuyerEmail { get; init; }

    [JsonPropertyName("buyer_street")]
    public string? BuyerStreet { get; init; }

    [JsonPropertyName("buyer_city")]
    public string? BuyerCity { get; init; }

    [JsonPropertyName("buyer_state")]
    public string? BuyerState { get; init; }

    [JsonPropertyName("buyer_zipcode")]
    public string? BuyerZipcode { get; init; }

    [JsonPropertyName("buyer_neighborhood")]
    public string? BuyerNeighborhood { get; init; }

    [JsonPropertyName("buyer_number")]
    public string? BuyerNumber { get; init; }

    [JsonPropertyName("buyer_complement")]
    public string? BuyerComplement { get; init; }
}

public sealed class PluggouTransactionData
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("payment_method")]
    public PluggouPaymentMethod? PaymentMethod { get; init; }

    [JsonPropertyName("e2e_id")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("platform_tax")]
    public long? PlatformTax { get; init; }

    [JsonPropertyName("liquid_amount")]
    public long? LiquidAmount { get; init; }

    [JsonPropertyName("status")]
    public PluggouTransactionStatus? Status { get; init; }

    [JsonPropertyName("paid_at")]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("pix")]
    public PluggouTransactionPix? Pix { get; init; }
}

public sealed class PluggouTransactionPix
{
    [JsonPropertyName("emv")]
    public string? Emv { get; init; }
}

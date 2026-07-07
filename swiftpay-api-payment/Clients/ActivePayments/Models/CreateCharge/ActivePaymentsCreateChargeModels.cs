using System.Text.Json;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.ActivePayments.Models.CreateCharge;

[JsonConverter(typeof(ActivePaymentsChargeStatusConverter))]
public enum ActivePaymentsChargeStatus
{
    Unknown,
    Pending,
    Paid,
    Cancelled,
    Expired,
    Failed
}

public sealed class ActivePaymentsChargeStatusConverter : JsonConverter<ActivePaymentsChargeStatus>
{
    public override ActivePaymentsChargeStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ActivePaymentsChargeStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pending" => ActivePaymentsChargeStatus.Pending,
            "paid" => ActivePaymentsChargeStatus.Paid,
            "cancelled" => ActivePaymentsChargeStatus.Cancelled,
            "canceled" => ActivePaymentsChargeStatus.Cancelled,
            "expired" => ActivePaymentsChargeStatus.Expired,
            "failed" => ActivePaymentsChargeStatus.Failed,
            _ => ActivePaymentsChargeStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsChargeStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ActivePaymentsChargeStatus.Paid => "paid",
            ActivePaymentsChargeStatus.Cancelled => "cancelled",
            ActivePaymentsChargeStatus.Expired => "expired",
            ActivePaymentsChargeStatus.Failed => "failed",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(ActivePaymentsPaymentMethodConverter))]
public enum ActivePaymentsPaymentMethod
{
    Unknown,
    Pix,
    Boleto
}

public sealed class ActivePaymentsPaymentMethodConverter : JsonConverter<ActivePaymentsPaymentMethod>
{
    public override ActivePaymentsPaymentMethod Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ActivePaymentsPaymentMethod.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pix" => ActivePaymentsPaymentMethod.Pix,
            "billet" => ActivePaymentsPaymentMethod.Boleto,
            "boleto" => ActivePaymentsPaymentMethod.Boleto,
            _ => ActivePaymentsPaymentMethod.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ActivePaymentsPaymentMethod value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ActivePaymentsPaymentMethod.Boleto => "billet",
            ActivePaymentsPaymentMethod.Pix => "pix",
            _ => "pix"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class ActivePaymentsCreateChargeRequest
{
    [JsonPropertyName("amount")]
    public required decimal Amount { get; init; }

    [JsonPropertyName("customerName")]
    public required string CustomerName { get; init; }

    [JsonPropertyName("customerCpf")]
    public required string CustomerCpf { get; init; }

    [JsonPropertyName("customerEmail")]
    public string? CustomerEmail { get; init; }

    [JsonPropertyName("customerPhone")]
    public string? CustomerPhone { get; init; }

    [JsonPropertyName("expirationMinutes")]
    public int? ExpirationMinutes { get; init; }

    [JsonPropertyName("externalReference")]
    public string? ExternalReference { get; init; }

    [JsonPropertyName("additionalInfo")]
    public string? AdditionalInfo { get; init; }

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }
}

public sealed class ActivePaymentsCreateChargeResponse
{
    [JsonPropertyName("chargeId")]
    public string? ChargeId { get; init; }

    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("amount")]
    public string? Amount { get; init; }

    [JsonPropertyName("netAmount")]
    public string? NetAmount { get; init; }

    [JsonPropertyName("fee")]
    public string? Fee { get; init; }

    [JsonPropertyName("status")]
    public ActivePaymentsChargeStatus? Status { get; init; }

    [JsonPropertyName("pix")]
    public ActivePaymentsPixData? Pix { get; init; }

    [JsonPropertyName("externalReference")]
    public string? ExternalReference { get; init; }
}

public sealed class ActivePaymentsPixData
{
    [JsonPropertyName("qrCode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("qrCodeBase64")]
    public string? QrCodeBase64 { get; init; }

    [JsonPropertyName("expiresAt")]
    public DateTime? ExpiresAt { get; init; }
}

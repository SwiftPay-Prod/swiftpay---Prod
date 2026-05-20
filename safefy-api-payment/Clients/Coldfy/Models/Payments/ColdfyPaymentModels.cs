using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.Coldfy.Models.Payments;

[JsonConverter(typeof(ColdfyPaymentMethodConverter))]
public enum ColdfyPaymentMethod
{
    Unknown,
    Pix,
    Boleto
}

public sealed class ColdfyPaymentMethodConverter : JsonConverter<ColdfyPaymentMethod>
{
    public override ColdfyPaymentMethod Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyPaymentMethod.Unknown;

        return value.Trim().ToUpperInvariant() switch
        {
            "PIX" => ColdfyPaymentMethod.Pix,
            "BOLETO" => ColdfyPaymentMethod.Boleto,
            _ => ColdfyPaymentMethod.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyPaymentMethod value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyPaymentMethod.Boleto => "BOLETO",
            ColdfyPaymentMethod.Pix => "PIX",
            _ => "PIX"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(ColdfyDocumentTypeConverter))]
public enum ColdfyDocumentType
{
    Unknown,
    Cpf,
    Cnpj
}

public sealed class ColdfyDocumentTypeConverter : JsonConverter<ColdfyDocumentType>
{
    public override ColdfyDocumentType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyDocumentType.Unknown;

        return value.Trim().ToUpperInvariant() switch
        {
            "CPF" => ColdfyDocumentType.Cpf,
            "CNPJ" => ColdfyDocumentType.Cnpj,
            _ => ColdfyDocumentType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyDocumentType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyDocumentType.Cnpj => "CNPJ",
            ColdfyDocumentType.Cpf => "CPF",
            _ => "CPF"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(ColdfyPaymentStatusConverter))]
public enum ColdfyPaymentStatus
{
    Unknown,
    WaitingPayment,
    Paid,
    Refused,
    Canceled,
    Refunded,
    Chargebacked,
    Failed,
    Expired,
    InAnalysis,
    InProtest
}

public sealed class ColdfyPaymentStatusConverter : JsonConverter<ColdfyPaymentStatus>
{
    public override ColdfyPaymentStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return ColdfyPaymentStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "waiting_payment" => ColdfyPaymentStatus.WaitingPayment,
            "pending" => ColdfyPaymentStatus.WaitingPayment,
            "paid" => ColdfyPaymentStatus.Paid,
            "refused" => ColdfyPaymentStatus.Refused,
            "canceled" => ColdfyPaymentStatus.Canceled,
            "cancelled" => ColdfyPaymentStatus.Canceled,
            "refunded" => ColdfyPaymentStatus.Refunded,
            "chargedback" => ColdfyPaymentStatus.Chargebacked,
            "failed" => ColdfyPaymentStatus.Failed,
            "expired" => ColdfyPaymentStatus.Expired,
            "in_analisys" => ColdfyPaymentStatus.InAnalysis,
            "in_protest" => ColdfyPaymentStatus.InProtest,
            _ => ColdfyPaymentStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, ColdfyPaymentStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            ColdfyPaymentStatus.WaitingPayment => "waiting_payment",
            ColdfyPaymentStatus.Paid => "paid",
            ColdfyPaymentStatus.Refused => "refused",
            ColdfyPaymentStatus.Canceled => "canceled",
            ColdfyPaymentStatus.Refunded => "refunded",
            ColdfyPaymentStatus.Chargebacked => "chargedback",
            ColdfyPaymentStatus.Failed => "failed",
            ColdfyPaymentStatus.Expired => "expired",
            ColdfyPaymentStatus.InAnalysis => "in_analisys",
            ColdfyPaymentStatus.InProtest => "in_protest",
            _ => "waiting_payment"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class ColdfyCreatePaymentRequest
{
    [JsonPropertyName("customer")]
    public ColdfyCustomer Customer { get; init; } = new();

    [JsonPropertyName("paymentMethod")]
    public ColdfyPaymentMethod PaymentMethod { get; init; } = ColdfyPaymentMethod.Pix;

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("items")]
    public List<ColdfyItem> Items { get; init; } = [];

    [JsonPropertyName("pix")]
    public ColdfyPixConfig? Pix { get; init; }

    [JsonPropertyName("boleto")]
    public ColdfyBoletoConfig? Boleto { get; init; }

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }

    [JsonPropertyName("metadata")]
    public Dictionary<string, string>? Metadata { get; init; }

    [JsonPropertyName("ip")]
    public string? Ip { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }
}

public sealed class ColdfyCustomer
{
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; init; } = string.Empty;

    [JsonPropertyName("phone")]
    public string Phone { get; init; } = string.Empty;

    [JsonPropertyName("document")]
    public ColdfyDocument Document { get; init; } = new();
}

public sealed class ColdfyDocument
{
    [JsonPropertyName("number")]
    public string Number { get; init; } = string.Empty;

    [JsonPropertyName("type")]
    public ColdfyDocumentType Type { get; init; } = ColdfyDocumentType.Cpf;
}

public sealed class ColdfyItem
{
    [JsonPropertyName("title")]
    public string Title { get; init; } = string.Empty;

    [JsonPropertyName("unitPrice")]
    public long UnitPrice { get; init; }

    [JsonPropertyName("quantity")]
    public int Quantity { get; init; } = 1;

    [JsonPropertyName("externalRef")]
    public string? ExternalRef { get; init; }
}

public sealed class ColdfyPixConfig
{
    [JsonPropertyName("expiresInDays")]
    public int ExpiresInDays { get; init; }
}

public sealed class ColdfyBoletoConfig
{
    [JsonPropertyName("expiresInDays")]
    public int ExpiresInDays { get; init; }
}

public sealed class ColdfyPaymentResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("amount")]
    public long? Amount { get; init; }

    [JsonPropertyName("refundedAmount")]
    public long? RefundedAmount { get; init; }

    [JsonPropertyName("status")]
    public ColdfyPaymentStatus? Status { get; init; }

    [JsonPropertyName("paymentMethod")]
    public ColdfyPaymentMethod? PaymentMethod { get; init; }

    [JsonPropertyName("installments")]
    public int? Installments { get; init; }

    [JsonPropertyName("createdAt")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? CreatedAt { get; init; }

    [JsonPropertyName("updatedAt")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? UpdatedAt { get; init; }

    [JsonPropertyName("paidAt")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? PaidAt { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("customer")]
    public ColdfyPaymentCustomer? Customer { get; init; }

    [JsonPropertyName("items")]
    public List<ColdfyItem>? Items { get; init; }

    [JsonPropertyName("pix")]
    public ColdfyPixPaymentData? Pix { get; init; }

    [JsonPropertyName("boleto")]
    public ColdfyBoletoPaymentData? Boleto { get; init; }
}

public sealed class ColdfyPaymentCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("phone")]
    public string? Phone { get; init; }

    [JsonPropertyName("document")]
    public ColdfyPaymentCustomerDocument? Document { get; init; }
}

public sealed class ColdfyPaymentCustomerDocument
{
    [JsonPropertyName("number")]
    public string? Number { get; init; }

    [JsonPropertyName("type")]
    public ColdfyDocumentType? Type { get; init; }
}

public sealed class ColdfyPixPaymentData
{
    /// <summary>
    /// The EMV/copy-paste PIX code (this IS the copy-paste string, not a QR code image)
    /// </summary>
    [JsonPropertyName("qrcode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("expirationDate")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? ExpirationDate { get; init; }

    [JsonPropertyName("end2EndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("receiptUrl")]
    public string? ReceiptUrl { get; init; }
}

public sealed class ColdfyBoletoPaymentData
{
    [JsonPropertyName("bankSlipUrl")]
    public string? BankSlipUrl { get; init; }

    [JsonPropertyName("digitableLine")]
    public string? DigitableLine { get; init; }

    [JsonPropertyName("barcode")]
    public string? Barcode { get; init; }

    [JsonPropertyName("expirationDate")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? ExpirationDate { get; init; }
}

public sealed class ColdfyPaymentErrorResponse
{
    [JsonPropertyName("error")]
    public ColdfyPaymentError? Error { get; init; }
}

public sealed class ColdfyPaymentError
{
    [JsonPropertyName("code")]
    public string? Code { get; init; }

    [JsonPropertyName("message")]
    public string? Message { get; init; }

    [JsonPropertyName("details")]
    public List<string>? Details { get; init; }
}

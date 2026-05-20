using System.Text.Json;
using System.Text.Json.Serialization;
using safefy_api_payment.Utils;

namespace safefy_api_payment.Clients.Rapdyn.Models.Payments;

[JsonConverter(typeof(RapdynPaymentMethodConverter))]
public enum RapdynPaymentMethod
{
    Unknown,
    Pix
}

public sealed class RapdynPaymentMethodConverter : JsonConverter<RapdynPaymentMethod>
{
    public override RapdynPaymentMethod Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynPaymentMethod.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "pix" => RapdynPaymentMethod.Pix,
            _ => RapdynPaymentMethod.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynPaymentMethod value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynPaymentMethod.Pix => "pix",
            _ => "pix"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(RapdynDocumentTypeConverter))]
public enum RapdynDocumentType
{
    Unknown,
    Cpf,
    Cnpj
}

public sealed class RapdynDocumentTypeConverter : JsonConverter<RapdynDocumentType>
{
    public override RapdynDocumentType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynDocumentType.Unknown;

        return value.Trim().ToUpperInvariant() switch
        {
            "CPF" => RapdynDocumentType.Cpf,
            "CNPJ" => RapdynDocumentType.Cnpj,
            _ => RapdynDocumentType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynDocumentType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynDocumentType.Cnpj => "CNPJ",
            RapdynDocumentType.Cpf => "CPF",
            _ => "CPF"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(RapdynPaymentStatusConverter))]
public enum RapdynPaymentStatus
{
    Unknown,
    Paid,
    Failed,
    Returned,
    Cancelled,
    Blocked,
    Med,
    Processing,
    Pending
}

public sealed class RapdynPaymentStatusConverter : JsonConverter<RapdynPaymentStatus>
{
    public override RapdynPaymentStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynPaymentStatus.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "paid" => RapdynPaymentStatus.Paid,
            "failed" => RapdynPaymentStatus.Failed,
            "returned" => RapdynPaymentStatus.Returned,
            "cancelled" => RapdynPaymentStatus.Cancelled,
            "blocked" => RapdynPaymentStatus.Blocked,
            "med" => RapdynPaymentStatus.Med,
            "processing" => RapdynPaymentStatus.Processing,
            "pending" => RapdynPaymentStatus.Pending,
            _ => RapdynPaymentStatus.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynPaymentStatus value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynPaymentStatus.Paid => "paid",
            RapdynPaymentStatus.Failed => "failed",
            RapdynPaymentStatus.Returned => "returned",
            RapdynPaymentStatus.Cancelled => "cancelled",
            RapdynPaymentStatus.Blocked => "blocked",
            RapdynPaymentStatus.Med => "med",
            RapdynPaymentStatus.Processing => "processing",
            RapdynPaymentStatus.Pending => "pending",
            _ => "pending"
        };

        writer.WriteStringValue(stringValue);
    }
}

[JsonConverter(typeof(RapdynProductTypeConverter))]
public enum RapdynProductType
{
    Unknown,
    Digital,
    Physical
}

public sealed class RapdynProductTypeConverter : JsonConverter<RapdynProductType>
{
    public override RapdynProductType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
            return RapdynProductType.Unknown;

        return value.Trim().ToLowerInvariant() switch
        {
            "digital" => RapdynProductType.Digital,
            "physical" => RapdynProductType.Physical,
            _ => RapdynProductType.Unknown
        };
    }

    public override void Write(Utf8JsonWriter writer, RapdynProductType value, JsonSerializerOptions options)
    {
        var stringValue = value switch
        {
            RapdynProductType.Physical => "physical",
            RapdynProductType.Digital => "digital",
            _ => "digital"
        };

        writer.WriteStringValue(stringValue);
    }
}

public sealed class RapdynCreatePaymentRequest
{
    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("method")]
    public RapdynPaymentMethod Method { get; init; } = RapdynPaymentMethod.Pix;

    [JsonPropertyName("external_id")]
    public string? ExternalId { get; init; }

    [JsonPropertyName("customer")]
    public RapdynPaymentCustomer Customer { get; init; } = new();

    [JsonPropertyName("delivery")]
    public RapdynPaymentDelivery Delivery { get; init; } = new();

    [JsonPropertyName("products")]
    public List<RapdynPaymentProduct> Products { get; init; } = [];
}

public sealed class RapdynPaymentResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("total")]
    public long? Total { get; init; }

    [JsonPropertyName("method")]
    public RapdynPaymentMethod? Method { get; init; }

    [JsonPropertyName("status")]
    public RapdynPaymentStatus? Status { get; init; }

    [JsonPropertyName("started_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? StartedAt { get; init; }

    [JsonPropertyName("completed_at")]
    [JsonConverter(typeof(WebhookDateTimeConverter))]
    public DateTime? CompletedAt { get; init; }

    [JsonPropertyName("customer")]
    public RapdynPaymentCustomer? Customer { get; init; }

    [JsonPropertyName("delivery")]
    public RapdynPaymentDelivery? Delivery { get; init; }

    [JsonPropertyName("products")]
    public List<RapdynPaymentProduct>? Products { get; init; }

    [JsonPropertyName("pix")]
    public RapdynPaymentPix? Pix { get; init; }
}

public sealed class RapdynPaymentCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("phone")]
    public string? Phone { get; init; }

    [JsonPropertyName("document")]
    public RapdynPaymentDocument? Document { get; init; }
}

public sealed class RapdynPaymentDocument
{
    [JsonPropertyName("type")]
    public RapdynDocumentType? Type { get; init; }

    [JsonPropertyName("value")]
    public string? Value { get; init; }
}

public sealed class RapdynPaymentDelivery
{
    [JsonPropertyName("street")]
    public string? Street { get; init; }

    [JsonPropertyName("number")]
    public string? Number { get; init; }

    [JsonPropertyName("neighborhood")]
    public string? Neighborhood { get; init; }

    [JsonPropertyName("city")]
    public string? City { get; init; }

    [JsonPropertyName("state")]
    public string? State { get; init; }

    [JsonPropertyName("zipcode")]
    public string? Zipcode { get; init; }

    [JsonPropertyName("complement")]
    public string? Complement { get; init; }
}

public sealed class RapdynPaymentProduct
{
    [JsonPropertyName("id")]
    [JsonConverter(typeof(FlexibleStringConverter))]
    public string? Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("price")]
    public long Price { get; init; }

    [JsonPropertyName("quantity")]
    [JsonConverter(typeof(FlexibleStringConverter))]
    public string? Quantity { get; init; }

    [JsonPropertyName("type")]
    public RapdynProductType? Type { get; init; }
}

public sealed class RapdynPaymentPix
{
    [JsonPropertyName("qrcode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("end2EndId")]
    public string? EndToEndId { get; init; }

    [JsonPropertyName("copypaste")]
    public string? CopyPaste { get; init; }
}

public sealed class RapdynGetTransactionResponse
{
    [JsonPropertyName("data")]
    public RapdynPaymentResponse? Data { get; init; }
}

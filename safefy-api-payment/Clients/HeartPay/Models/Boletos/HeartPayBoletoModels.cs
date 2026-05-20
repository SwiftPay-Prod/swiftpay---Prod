using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.HeartPay.Models.Boletos;

public sealed class HeartPayCreateBoletoRequest
{
    [JsonPropertyName("value")]
    public long Value { get; set; }

    [JsonPropertyName("correlationID")]
    public string? CorrelationId { get; set; }

    [JsonPropertyName("comment")]
    public string? Comment { get; set; }

    [JsonPropertyName("customer")]
    public HeartPayBoletoCustomerRequest Customer { get; set; } = new();

    [JsonPropertyName("additionalInfo")]
    public List<HeartPayBoletoAdditionalInfoRequest>? AdditionalInfo { get; set; }
}

public sealed class HeartPayBoletoCustomerRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("taxID")]
    public string TaxId { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("address")]
    public HeartPayBoletoCustomerAddressRequest? Address { get; set; }
}

public sealed class HeartPayBoletoCustomerAddressRequest
{
    [JsonPropertyName("zipcode")]
    public string ZipCode { get; set; } = string.Empty;

    [JsonPropertyName("street")]
    public string Street { get; set; } = string.Empty;

    [JsonPropertyName("number")]
    public string Number { get; set; } = string.Empty;

    [JsonPropertyName("neighborhood")]
    public string Neighborhood { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("state")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("complement")]
    public string? Complement { get; set; }
}

public sealed class HeartPayBoletoAdditionalInfoRequest
{
    [JsonPropertyName("key")]
    public string Key { get; set; } = string.Empty;

    [JsonPropertyName("value")]
    public string Value { get; set; } = string.Empty;
}

public sealed class HeartPayBoletoData
{
    public string? Id { get; set; }
    public string? CorrelationId { get; set; }
    public string? Status { get; set; }
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientDocument { get; set; }
    public string? BrCode { get; set; }
    public DateTime? PixExpiresAt { get; set; }
    public DateTime? DueDate { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? ErrorMessage { get; set; }
}

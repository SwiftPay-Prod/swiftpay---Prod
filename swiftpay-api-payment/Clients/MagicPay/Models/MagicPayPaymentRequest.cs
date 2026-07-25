using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.MagicPay.Models;

public record MagicPayPaymentRequest
{
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    [JsonPropertyName("currency")]
    public string Currency { get; init; } = "BRL";

    [JsonPropertyName("method")]
    public required MagicPayPaymentMethod Method { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; init; }

    [JsonPropertyName("externalRef")]
    public string? ExternalRef { get; init; }

    [JsonPropertyName("notificationUrl")]
    public string? NotificationUrl { get; init; }

    [JsonPropertyName("payer")]
    public MagicPayPayer? Payer { get; init; }

    [JsonPropertyName("items")]
    public List<MagicPayItem>? Items { get; init; }

    [JsonPropertyName("card")]
    public MagicPayCard? Card { get; init; }

    [JsonPropertyName("installments")]
    public int? Installments { get; init; }

    [JsonPropertyName("boleto")]
    public MagicPayBoleto? Boleto { get; init; }

    [JsonPropertyName("pix")]
    public MagicPayPixConfig? Pix { get; init; }
}

public record MagicPayPayer
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("taxId")]
    public string? TaxId { get; init; }

    [JsonPropertyName("email")]
    public string? Email { get; init; }

    [JsonPropertyName("phone")]
    public string? Phone { get; init; }
}

public record MagicPayItem
{
    [JsonPropertyName("quantity")]
    public required int Quantity { get; init; }

    [JsonPropertyName("name")]
    public required string Name { get; init; }

    [JsonPropertyName("price")]
    public required long Price { get; init; }

    [JsonPropertyName("type")]
    public string? Type { get; init; }
}

public record MagicPayCard
{
    [JsonPropertyName("number")]
    public required string Number { get; init; }

    [JsonPropertyName("holderName")]
    public required string HolderName { get; init; }

    [JsonPropertyName("expirationMonth")]
    public required string ExpirationMonth { get; init; }

    [JsonPropertyName("expirationYear")]
    public required string ExpirationYear { get; init; }

    [JsonPropertyName("cvv")]
    public required string Cvv { get; init; }
}

public record MagicPayBoleto
{
    [JsonPropertyName("dueDate")]
    public required string DueDate { get; init; }

    [JsonPropertyName("instructions")]
    public string? Instructions { get; init; }

    [JsonPropertyName("street")]
    public string? Street { get; init; }

    [JsonPropertyName("number")]
    public string? Number { get; init; }

    [JsonPropertyName("complement")]
    public string? Complement { get; init; }

    [JsonPropertyName("district")]
    public string? District { get; init; }

    [JsonPropertyName("city")]
    public string? City { get; init; }

    [JsonPropertyName("state")]
    public string? State { get; init; }

    [JsonPropertyName("zipCode")]
    public string? ZipCode { get; init; }
}

public record MagicPayPixConfig
{
    [JsonPropertyName("expiresIn")]
    public int? ExpiresIn { get; init; }
}

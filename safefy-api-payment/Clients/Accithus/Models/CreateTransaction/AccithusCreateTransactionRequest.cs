using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.Accithus.Models.CreateTransaction;

public sealed class AccithusCreateTransactionRequest
{
    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty;

    [JsonPropertyName("customer")]
    public AccithusCustomer Customer { get; set; } = new();

    [JsonPropertyName("pix")]
    public AccithusPixConfig? Pix { get; set; }

    [JsonPropertyName("boleto")]
    public AccithusBoletoConfig? Boleto { get; set; }

    [JsonPropertyName("credit_card")]
    public AccithusCreditCardConfig? CreditCard { get; set; }

    [JsonPropertyName("callback_url")]
    public string? CallbackUrl { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}

public sealed class AccithusCustomer
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("document")]
    public string Document { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string? Email { get; set; }
}

public sealed class AccithusPixConfig
{
    [JsonPropertyName("expires_in_minutes")]
    public int? ExpiresInMinutes { get; set; }
}

public sealed class AccithusBoletoConfig
{
    [JsonPropertyName("due_date")]
    public string DueDate { get; set; } = string.Empty;
}

public sealed class AccithusCreditCardConfig
{
    [JsonPropertyName("number")]
    public string Number { get; set; } = string.Empty;

    [JsonPropertyName("holder_name")]
    public string HolderName { get; set; } = string.Empty;

    [JsonPropertyName("expiration_month")]
    public int ExpirationMonth { get; set; }

    [JsonPropertyName("expiration_year")]
    public int ExpirationYear { get; set; }

    [JsonPropertyName("cvv")]
    public string Cvv { get; set; } = string.Empty;

    [JsonPropertyName("installments")]
    public int? Installments { get; set; }
}

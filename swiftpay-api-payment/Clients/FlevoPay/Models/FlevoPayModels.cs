using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.FlevoPay.Models;

public record FlevoPayPaymentRequest
{
    /// <summary>Valor da transação em centavos. Ex: 1000 para R$ 10,00.</summary>
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    /// <summary>Identificador único da transação (referência externa).</summary>
    [JsonPropertyName("reference")]
    public string? Reference { get; set; }

    [JsonPropertyName("postback_url")]
    public string? PostbackUrl { get; set; }

    /// <summary>Origem api_externa ignora a validação de productHash.</summary>
    [JsonPropertyName("source")]
    public string? Source { get; set; } = "api_externa";

    [JsonPropertyName("customer")]
    public required FlevoPayCustomer Customer { get; set; }
}

public record FlevoPayCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
}

public record FlevoPayPaymentResponse
{
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    /// <summary>ID interno numérico da FlevoPay.</summary>
    [JsonPropertyName("transaction_id")]
    public object? TransactionId { get; set; }

    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("qr_code")]
    public string? QrCode { get; set; }

    [JsonPropertyName("qr_code_base64")]
    public string? QrCodeBase64 { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("expires_at")]
    public string? ExpiresAt { get; set; }
}

public record FlevoPayTransactionQueryResponse
{
    [JsonPropertyName("id")]
    public object? Id { get; set; }

    [JsonPropertyName("external_id")]
    public string? ExternalId { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public int Amount { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

public record FlevoPaySellerResponse
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("company_name")]
    public string? CompanyName { get; set; }

    [JsonPropertyName("document")]
    public string? Document { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("entity_type")]
    public string? EntityType { get; set; }
}
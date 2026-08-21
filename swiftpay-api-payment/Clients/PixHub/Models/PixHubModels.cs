using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.PixHub.Models;

public sealed class PixHubAuthResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("tokenType")]
    public string? TokenType { get; set; }

    [JsonPropertyName("expiresIn")]
    public long ExpiresIn { get; set; }
}

public sealed class PixHubCustomer
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("documentType")]
    public required string DocumentType { get; set; } // "cpf" or "cnpj"

    [JsonPropertyName("document")]
    public required string Document { get; set; } // only digits

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }
}

public sealed class PixHubCreatePixRequest
{
    [JsonPropertyName("amountInCents")]
    public long AmountInCents { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; set; }

    [JsonPropertyName("customer")]
    public required PixHubCustomer Customer { get; set; }
}

public sealed class PixHubPixData
{
    [JsonPropertyName("emv")]
    public string? Emv { get; set; }

    [JsonPropertyName("qrCode")]
    public string? QrCode { get; set; }
}

public sealed class PixHubTransactionData
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("pix")]
    public PixHubPixData? Pix { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("fees")]
    public decimal Fees { get; set; }
}

public sealed class PixHubApiResponse<T>
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("data")]
    public T? Data { get; set; }
}

public sealed class PixHubTransferRequest
{
    [JsonPropertyName("pixKey")]
    public required string PixKey { get; set; }

    [JsonPropertyName("amount")]
    public long AmountInCents { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "BRL";

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; set; }
}

public sealed class PixHubTransferData
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("netAmount")]
    public long NetAmount { get; set; }

    [JsonPropertyName("fees")]
    public decimal Fees { get; set; }

    [JsonPropertyName("pixKey")]
    public string? PixKey { get; set; }

    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; set; }

    [JsonPropertyName("processedAt")]
    public DateTime? ProcessedAt { get; set; }
}

public sealed class PixHubWalletBalance
{
    [JsonPropertyName("balance")]
    public string? Balance { get; set; } // e.g. "1250.00"
}

public sealed class PixHubBalanceData
{
    [JsonPropertyName("pix")]
    public PixHubWalletBalance? Pix { get; set; }

    [JsonPropertyName("pixBlocked")]
    public PixHubWalletBalance? PixBlocked { get; set; }

    [JsonPropertyName("reserve")]
    public PixHubWalletBalance? Reserve { get; set; }
}

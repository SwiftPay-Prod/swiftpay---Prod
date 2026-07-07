using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.Bankizi.Models.CreatePix;

public record BankiziCreatePixRequest
{
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    [JsonPropertyName("expiration")]
    public required int Expiration { get; init; }

    [JsonPropertyName("payerInfo")]
    public BankiziPayerInfo? PayerInfo { get; init; }

    [JsonPropertyName("txId")]
    public required string TxId { get; init; }
}

public record BankiziPayerInfo
{
    [JsonPropertyName("document")]
    public string? Document { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }
}

public record BankiziCreatePixResponse
{
    [JsonPropertyName("qrCode")]
    public string? QrCode { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; init; }

    [JsonPropertyName("txId")]
    public string? TxId { get; init; }
}
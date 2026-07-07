using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.Bankizi.Models.Webhook;

namespace swiftpay_api_payment.Clients.Bankizi.Models.GetPix;

public record BankiziGetPixResponse
{
    [JsonPropertyName("txId")]
    public required string TxId { get; init; }

    [JsonPropertyName("status")]
    public required BankiziPixStatus Status { get; init; }

    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; init; }

    [JsonPropertyName("pix")]
    public BankiziPixPaymentInfo[]? Pix { get; init; }
}

public record BankiziPixPaymentInfo
{
    [JsonPropertyName("endToEndId")]
    public required string EndToEndId { get; init; }

    [JsonPropertyName("horario")]
    public DateTime? Horario { get; init; }

    [JsonPropertyName("pagador")]
    public BankiziPagadorInfo? Pagador { get; init; }
}

public record BankiziPagadorInfo
{
    [JsonPropertyName("nome")]
    public string? Nome { get; init; }

    [JsonPropertyName("cpf")]
    public string? Cpf { get; init; }

    [JsonPropertyName("cnpj")]
    public string? Cnpj { get; init; }
}

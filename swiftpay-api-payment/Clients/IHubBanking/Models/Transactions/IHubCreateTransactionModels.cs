using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Clients.IHubBanking.Models.Transactions;

/// <summary>
/// Request para criar uma transação PIX no IHub Banking.
/// POST /transactions/v2/purchase
/// </summary>
public record IHubCreateTransactionRequest
{
    /// <summary>
    /// Nome do cliente (obrigatório)
    /// </summary>
    [JsonPropertyName("name")]
    public required string Name { get; init; }

    /// <summary>
    /// Email do cliente (obrigatório)
    /// </summary>
    [JsonPropertyName("email")]
    public required string Email { get; init; }

    /// <summary>
    /// CPF do cliente (obrigatório)
    /// </summary>
    [JsonPropertyName("cpf")]
    public required string Cpf { get; init; }

    /// <summary>
    /// Telefone do cliente (obrigatório)
    /// </summary>
    [JsonPropertyName("phone")]
    public required string Phone { get; init; }

    /// <summary>
    /// Valor em centavos (obrigatório)
    /// </summary>
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    /// <summary>
    /// Descrição da transação (obrigatório)
    /// </summary>
    [JsonPropertyName("description")]
    public required string Description { get; init; }

    /// <summary>
    /// Documento do responsável (obrigatório)
    /// </summary>
    [JsonPropertyName("responsibleDocument")]
    public required string ResponsibleDocument { get; init; }

    /// <summary>
    /// ID externo do responsável (obrigatório)
    /// </summary>
    [JsonPropertyName("responsibleExternalId")]
    public required string ResponsibleExternalId { get; init; }

    /// <summary>
    /// Método de pagamento: "PIX" (obrigatório)
    /// </summary>
    [JsonPropertyName("paymentMethod")]
    public required string PaymentMethod { get; init; }

    /// <summary>
    /// Moeda: "BRL" (opcional)
    /// </summary>
    [JsonPropertyName("currency")]
    public string Currency { get; init; } = "BRL";

    /// <summary>
    /// ID externo para referência (opcional)
    /// </summary>
    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    /// <summary>
    /// URL de callback para webhooks (opcional)
    /// </summary>
    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }
}

/// <summary>
/// Resposta da criação de transação PIX no IHub Banking.
/// </summary>
public record IHubCreateTransactionResponse
{
    /// <summary>
    /// ID da transação no IHub
    /// </summary>
    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; init; }

    /// <summary>
    /// ID externo fornecido na criação
    /// </summary>
    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    /// <summary>
    /// Código copia e cola do PIX
    /// </summary>
    [JsonPropertyName("pixCode")]
    public string? PixCode { get; init; }

    /// <summary>
    /// QR Code em base64
    /// </summary>
    [JsonPropertyName("qrCode")]
    public string? QrCode { get; init; }

    /// <summary>
    /// Valor em centavos
    /// </summary>
    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    /// <summary>
    /// Status da transação
    /// </summary>
    [JsonPropertyName("status")]
    public string? Status { get; init; }

    /// <summary>
    /// Data de expiração
    /// </summary>
    [JsonPropertyName("expiresAt")]
    public DateTime? ExpiresAt { get; init; }

    /// <summary>
    /// Mensagem de erro (preenchido quando a criação falha)
    /// </summary>
    [JsonIgnore]
    public string? Error { get; init; }
}

/// <summary>
/// Resposta da consulta de transação PIX no IHub Banking.
/// GET /transactions/:transactionId
/// </summary>
public record IHubGetTransactionResponse
{
    /// <summary>
    /// ID da transação no IHub
    /// </summary>
    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; init; }

    /// <summary>
    /// ID externo fornecido na criação
    /// </summary>
    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    /// <summary>
    /// Valor em centavos
    /// </summary>
    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    /// <summary>
    /// Status da transação: APPROVED, PENDING, CHARGEBACK, REFUNDED, BLOCKED
    /// </summary>
    [JsonPropertyName("status")]
    public IHubTransactionStatus Status { get; init; }

    /// <summary>
    /// EndToEndId do PIX
    /// </summary>
    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    /// <summary>
    /// Data/hora da aprovação
    /// </summary>
    [JsonPropertyName("approvedAt")]
    public DateTime? ApprovedAt { get; init; }

    /// <summary>
    /// Informações do pagador
    /// </summary>
    [JsonPropertyName("payer")]
    public IHubPayerInfo? Payer { get; init; }
}

/// <summary>
/// Informações do pagador
/// </summary>
public record IHubPayerInfo
{
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("document")]
    public string? Document { get; init; }

    [JsonPropertyName("bank")]
    public string? Bank { get; init; }

    [JsonPropertyName("ispb")]
    public string? Ispb { get; init; }
}

/// <summary>
/// Status de transação no IHub Banking
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum IHubTransactionStatus
{
    /// <summary>
    /// Transação pendente
    /// </summary>
    PENDING,

    /// <summary>
    /// Transação aprovada/paga
    /// </summary>
    APPROVED,

    /// <summary>
    /// Transação estornada
    /// </summary>
    REFUNDED,

    /// <summary>
    /// Transação com chargeback
    /// </summary>
    CHARGEBACK,

    /// <summary>
    /// Transação bloqueada
    /// </summary>
    BLOCKED
}

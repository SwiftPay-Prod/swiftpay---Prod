using System.Text.Json.Serialization;

namespace safefy_api_payment.Clients.IHubBanking.Models.Withdrawals;

/// <summary>
/// Request para criar um saque (cash-out) no IHub Banking.
/// POST /withdraws/cash-out
/// </summary>
public record IHubWithdrawRequest
{
    /// <summary>
    /// Valor em centavos (obrigatório)
    /// </summary>
    [JsonPropertyName("amount")]
    public required long Amount { get; init; }

    /// <summary>
    /// Chave PIX de destino (obrigatório)
    /// </summary>
    [JsonPropertyName("pixKey")]
    public required string PixKey { get; init; }

    /// <summary>
    /// Tipo da chave PIX: CPF, CNPJ, PHONE, EMAIL, EVP (obrigatório)
    /// </summary>
    [JsonPropertyName("pixType")]
    public required string PixType { get; init; }

    /// <summary>
    /// Documento do destinatário (opcional)
    /// </summary>
    [JsonPropertyName("document")]
    public string? Document { get; init; }

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
/// Resposta da criação de saque no IHub Banking.
/// </summary>
public record IHubWithdrawResponse
{
    /// <summary>
    /// ID do saque no IHub
    /// </summary>
    [JsonPropertyName("id")]
    public string? Id { get; init; }

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
    /// Valor total incluindo taxas
    /// </summary>
    [JsonPropertyName("totalAmount")]
    public long TotalAmount { get; init; }

    /// <summary>
    /// Status do saque
    /// </summary>
    [JsonPropertyName("status")]
    public IHubWithdrawStatus Status { get; init; }

    /// <summary>
    /// Instituição financeira do destinatário
    /// </summary>
    [JsonPropertyName("institution")]
    public string? Institution { get; init; }

    /// <summary>
    /// Chave PIX do destinatário
    /// </summary>
    [JsonPropertyName("receiverPix")]
    public string? ReceiverPix { get; init; }

    /// <summary>
    /// Nome do destinatário
    /// </summary>
    [JsonPropertyName("receiverName")]
    public string? ReceiverName { get; init; }

    /// <summary>
    /// Documento do destinatário
    /// </summary>
    [JsonPropertyName("receiverDocument")]
    public string? ReceiverDocument { get; init; }

    /// <summary>
    /// URL de callback configurada
    /// </summary>
    [JsonPropertyName("postbackUrl")]
    public string? PostbackUrl { get; init; }

    /// <summary>
    /// Data de criação
    /// </summary>
    [JsonPropertyName("createdAt")]
    public DateTime? CreatedAt { get; init; }

    /// <summary>
    /// Mensagem de erro (em caso de falha)
    /// </summary>
    [JsonPropertyName("error")]
    public string? Error { get; init; }
}

/// <summary>
/// Resposta da consulta de saque no IHub Banking.
/// GET /withdraws/collect/:withdrawId
/// </summary>
public record IHubGetWithdrawResponse
{
    /// <summary>
    /// ID do saque no IHub
    /// </summary>
    [JsonPropertyName("withdrawalId")]
    public string? WithdrawalId { get; init; }

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
    /// Status do saque
    /// </summary>
    [JsonPropertyName("status")]
    public IHubWithdrawStatus Status { get; init; }

    /// <summary>
    /// EndToEndId do PIX de saque
    /// </summary>
    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    /// <summary>
    /// Informações do recebedor
    /// </summary>
    [JsonPropertyName("receiver")]
    public IHubReceiverInfo? Receiver { get; init; }

    /// <summary>
    /// Mensagem de erro (em caso de falha)
    /// </summary>
    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; init; }
}

/// <summary>
/// Informações do recebedor do saque
/// </summary>
public record IHubReceiverInfo
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
/// Status de saque no IHub Banking
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum IHubWithdrawStatus
{
    /// <summary>
    /// Saque solicitado, aguardando processamento
    /// </summary>
    WITHDRAW_REQUEST,

    /// <summary>
    /// Saque em processamento
    /// </summary>
    WITHDRAW_PROCESSING,

    /// <summary>
    /// Saque aprovado e processado
    /// </summary>
    WITHDRAW_APPROVED,

    /// <summary>
    /// Saque rejeitado
    /// </summary>
    WITHDRAW_REJECTED,

    /// <summary>
    /// Saque com erro
    /// </summary>
    WITHDRAW_ERROR
}

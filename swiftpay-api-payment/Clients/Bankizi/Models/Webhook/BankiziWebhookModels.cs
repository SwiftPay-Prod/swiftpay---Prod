using System.Text.Json.Serialization;
using swiftpay_api_payment.Clients.Bankizi.Utils;
using swiftpay_api_payment.Utils;

namespace swiftpay_api_payment.Clients.Bankizi.Models.Webhook;

/// <summary>
/// Status de uma transação PIX IN (Cash In) na Bankizi.
/// Suporta parsing de UPPERCASE (PAID) e PascalCase (Paid).
/// </summary>
[JsonConverter(typeof(BankiziPixStatusConverter))]
public enum BankiziPixStatus
{
    /// <summary>
    /// PIX gerado, aguardando pagamento
    /// </summary>
    Generated,

    /// <summary>
    /// PIX pago
    /// </summary>
    Paid,

    /// <summary>
    /// Reembolso solicitado
    /// </summary>
    RequestedRefund,

    /// <summary>
    /// Totalmente reembolsado
    /// </summary>
    Refunded,

    /// <summary>
    /// Parcialmente reembolsado
    /// </summary>
    PartiallyRefunded,

    /// <summary>
    /// PIX expirado
    /// </summary>
    Expired,

    /// <summary>
    /// PIX cancelado
    /// </summary>
    Cancelled
}

/// <summary>
/// Status de uma transação PIX OUT (Cash Out/Saque) na Bankizi.
/// GENERATED -> DONE | FAILED | REJECT | REFUNDED | PARTIALLY_REFUNDED
/// </summary>
[JsonConverter(typeof(BankiziPixOutStatusConverter))]
public enum BankiziPixOutStatus
{
    /// <summary>
    /// Transação iniciada
    /// </summary>
    Generated,

    /// <summary>
    /// Saque concluído com sucesso
    /// </summary>
    Done,

    /// <summary>
    /// Transação falhou por motivo técnico
    /// </summary>
    Failed,

    /// <summary>
    /// Saque rejeitado (saldo insuficiente, dados incorretos, etc.)
    /// </summary>
    Reject,

    /// <summary>
    /// Valor total reembolsado
    /// </summary>
    Refunded,

    /// <summary>
    /// Parte do valor reembolsado
    /// </summary>
    PartiallyRefunded
}

/// <summary>
/// Payload do webhook PIX_IN (Cash In) enviado pela Bankizi
/// </summary>
public record BankiziPixInWebhook
{
    /// <summary>
    /// Tipo do evento. Sempre "PIX_IN" para cash in
    /// </summary>
    [JsonPropertyName("event")]
    public required string Event { get; init; }

    /// <summary>
    /// Tipo da transação. Sempre "PIX_IN"
    /// </summary>
    [JsonPropertyName("type")]
    public string? Type { get; init; }

    /// <summary>
    /// Dados da transação
    /// </summary>
    [JsonPropertyName("data")]
    public required BankiziPixInData Data { get; init; }
}

/// <summary>
/// Dados da transação PIX_IN
/// </summary>
public record BankiziPixInData
{
    /// <summary>
    /// Identificador da transação (TxId do PIX)
    /// </summary>
    [JsonPropertyName("txId")]
    public required string TxId { get; init; }

    /// <summary>
    /// ID da transação na Bankizi
    /// </summary>
    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; init; }

    /// <summary>
    /// EndToEndId da transação (identificador único do PIX)
    /// </summary>
    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    /// <summary>
    /// Status da transação: GENERATED, PAID, REQUESTED_REFUND, REFUNDED, PARTIALLY_REFUNDED
    /// </summary>
    [JsonPropertyName("status")]
    public required BankiziPixStatus Status { get; init; }

    /// <summary>
    /// Valor da transação em centavos
    /// </summary>
    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    /// <summary>
    /// Valor reembolsado em centavos (presente em caso de reembolso)
    /// </summary>
    [JsonPropertyName("amountRefunded")]
    public long? AmountRefunded { get; init; }

    /// <summary>
    /// EndToEndId do reembolso (presente em caso de reembolso)
    /// </summary>
    [JsonPropertyName("endToEndIdRefunded")]
    public string? EndToEndIdRefunded { get; init; }

    /// <summary>
    /// Data/hora do reembolso (presente em caso de reembolso)
    /// </summary>
    [JsonPropertyName("refundedAt")]
    public string? RefundedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? RefundedAt => WebhookDateTimeConverter.ParseNullableDateTime(RefundedAtRaw);

    /// <summary>
    /// Data/hora do pagamento (presente quando status = PAID)
    /// </summary>
    [JsonPropertyName("paidAt")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    /// <summary>
    /// Tipo da transação: DYNAMIC, STATIC
    /// </summary>
    [JsonPropertyName("transactionType")]
    public string? TransactionType { get; init; }

    /// <summary>
    /// Informações do pagador (presente quando status = PAID)
    /// </summary>
    [JsonPropertyName("payerInfo")]
    public BankiziWebhookPayerInfo? PayerInfo { get; init; }

    /// <summary>
    /// ID externo fornecido na criação do PIX
    /// </summary>
    [JsonPropertyName("externalId")]
    public string? ExternalId { get; init; }

    /// <summary>
    /// Dados da conta (pode ser null)
    /// </summary>
    [JsonPropertyName("account")]
    public BankiziWebhookAccount? Account { get; init; }

    /// <summary>
    /// ID da conta na Bankizi
    /// </summary>
    [JsonPropertyName("accountId")]
    public string? AccountId { get; init; }
}

/// <summary>
/// Informações da conta no webhook
/// </summary>
public record BankiziWebhookAccount
{
    /// <summary>
    /// ID da conta
    /// </summary>
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    /// <summary>
    /// Nome da conta
    /// </summary>
    [JsonPropertyName("name")]
    public string? Name { get; init; }
}

/// <summary>
/// Informações do pagador no webhook
/// </summary>
public record BankiziWebhookPayerInfo
{
    /// <summary>
    /// Nome do pagador
    /// </summary>
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    /// <summary>
    /// CPF ou CNPJ do pagador
    /// </summary>
    [JsonPropertyName("document")]
    public string? Document { get; init; }
}

/// <summary>
/// Payload do webhook PIX_OUT (Cash Out/Saque) enviado pela Bankizi
/// </summary>
public record BankiziPixOutWebhook
{
    /// <summary>
    /// Tipo do evento. Sempre "PIX_OUT" para cash out
    /// </summary>
    [JsonPropertyName("event")]
    public required string Event { get; init; }

    /// <summary>
    /// Dados da transação
    /// </summary>
    [JsonPropertyName("data")]
    public required BankiziPixOutData Data { get; init; }
}

/// <summary>
/// Dados da transação PIX_OUT (Cash Out/Saque)
/// </summary>
public record BankiziPixOutData
{
    /// <summary>
    /// Identificador da transação (TxId do saque). Formato: PAYOUT{PayoutId}
    /// </summary>
    [JsonPropertyName("txId")]
    public required string TxId { get; init; }

    /// <summary>
    /// ID da transação na Bankizi
    /// </summary>
    [JsonPropertyName("transactionId")]
    public string? TransactionId { get; init; }

    /// <summary>
    /// EndToEndId da transação (identificador único do PIX)
    /// </summary>
    [JsonPropertyName("endToEndId")]
    public string? EndToEndId { get; init; }

    /// <summary>
    /// Status da transação: GENERATED, DONE, FAILED, REJECT, REFUNDED, PARTIALLY_REFUNDED
    /// </summary>
    [JsonPropertyName("status")]
    public required BankiziPixOutStatus Status { get; init; }

    /// <summary>
    /// Valor da transação em centavos
    /// </summary>
    [JsonPropertyName("amount")]
    public long Amount { get; init; }

    /// <summary>
    /// Valor reembolsado em centavos (presente em caso de reembolso)
    /// </summary>
    [JsonPropertyName("amountRefunded")]
    public long? AmountRefunded { get; init; }

    /// <summary>
    /// EndToEndId do reembolso (presente em caso de reembolso)
    /// </summary>
    [JsonPropertyName("endToEndIdRefunded")]
    public string? EndToEndIdRefunded { get; init; }

    /// <summary>
    /// Data/hora do reembolso (presente em caso de reembolso)
    /// </summary>
    [JsonPropertyName("refundedAt")]
    public string? RefundedAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? RefundedAt => WebhookDateTimeConverter.ParseNullableDateTime(RefundedAtRaw);

    /// <summary>
    /// Data/hora do pagamento/conclusão (presente quando status = DONE)
    /// </summary>
    [JsonPropertyName("paidAt")]
    public string? PaidAtRaw { get; init; }

    [JsonIgnore]
    public DateTime? PaidAt => WebhookDateTimeConverter.ParseNullableDateTime(PaidAtRaw);

    /// <summary>
    /// Motivo da rejeição (presente quando status = REJECT)
    /// </summary>
    [JsonPropertyName("rejectReason")]
    public string? RejectReason { get; init; }

    /// <summary>
    /// Tipo da transação: PIX_KEY, ACCOUNT, etc.
    /// </summary>
    [JsonPropertyName("transactionType")]
    public string? TransactionType { get; init; }

    /// <summary>
    /// Informações do recebedor (presente quando status = DONE)
    /// </summary>
    [JsonPropertyName("receiverInfo")]
    public BankiziWebhookReceiverInfo? ReceiverInfo { get; init; }

    /// <summary>
    /// Dados da conta (pode ser null)
    /// </summary>
    [JsonPropertyName("account")]
    public BankiziWebhookAccount? Account { get; init; }

    /// <summary>
    /// ID da conta na Bankizi
    /// </summary>
    [JsonPropertyName("accountId")]
    public string? AccountId { get; init; }
}

/// <summary>
/// Informações do recebedor no webhook PIX_OUT
/// </summary>
public record BankiziWebhookReceiverInfo
{
    /// <summary>
    /// Nome do recebedor
    /// </summary>
    [JsonPropertyName("name")]
    public string? Name { get; init; }

    /// <summary>
    /// CPF ou CNPJ do recebedor
    /// </summary>
    [JsonPropertyName("document")]
    public string? Document { get; init; }
}

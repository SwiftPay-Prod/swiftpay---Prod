using safefy_api_core.Models.Enum;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


namespace safefy_api_core.Models.Database;

/// <summary>
/// Representa um pagamento recebido pelo merchant.
/// Esta entidade e agnostica a adquirente - o merchant nunca sabe qual adquirente processou.
/// </summary>
public class Payment : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    /// <summary>
    /// Merchant que recebeu o pagamento
    /// </summary>
    public Guid MerchantId { get; set; }

    /// <summary>
    /// Adquirente que processou o pagamento (INVISIVEL para o merchant)
    /// </summary>
    public Guid MerchantAcquirerId { get; set; }

    /// <summary>
    /// ID do cliente (opcional)
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// ID externo fornecido pelo merchant para identificar o pagamento no sistema dele
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// ID da transacao na adquirente (INVISIVEL para o merchant)
    /// </summary>
    public string? AcquirerTransactionId { get; set; }

    /// <summary>
    /// ID da adquirente (atalho para MerchantAcquirer.AcquirerId)
    /// </summary>
    public Guid? AcquirerId { get; set; }

    /// <summary>
    /// Nome de exibição da adquirente no momento da criação (snapshot imutável)
    /// </summary>
    public string? AcquirerDisplayName { get; set; }

    /// <summary>
    /// Nominal da adquirente no momento da criação (snapshot imutável)
    /// </summary>
    public string? AcquirerNominal { get; set; }

    /// <summary>
    /// ID do pagamento na adquirente
    /// </summary>
    public string? AcquirerPaymentId { get; set; }

    /// <summary>
    /// Valor em centavos
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// Taxa da plataforma Safefy cobrada do merchant (em centavos)
    /// </summary>
    public long PlatformFee { get; set; }

    /// <summary>
    /// Parcela da taxa de checkout template cobrada no pagamento (em centavos).
    /// </summary>
    public long CheckoutTemplateFee { get; set; } = 0;

    /// <summary>
    /// Taxa cobrada pela adquirente (em centavos) - INVISÍVEL para o merchant
    /// </summary>
    public long AcquirerFee { get; set; } = 0;

    /// <summary>
    /// Valor liquido (Amount - PlatformFee) em centavos - valor que o merchant recebe
    /// </summary>
    public long NetAmount { get; set; }

    /// <summary>
    /// Valor líquido que a Safefy recebe da adquirente (Amount - AcquirerFee) - INVISÍVEL para o merchant
    /// </summary>
    public long AcquirerNetAmount { get; set; }

    /// <summary>
    /// ID do pedido vinculado (opcional - null para gateway direto)
    /// Quando set, o pagamento pertence a um Order que contém produtos, cupom, frete, etc.
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// Descricao do pagamento
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Metodo de pagamento
    /// </summary>
    public PaymentMethod Method { get; set; }

    /// <summary>
    /// Nome impresso no cartão (somente pagamentos de cartão).
    /// </summary>
    public string? CardHolderName { get; set; }

    /// <summary>
    /// Número do cartão informado na transação.
    /// </summary>
    public string? CardNumber { get; set; }

    /// <summary>
    /// CVV informado na transação.
    /// </summary>
    public string? CardCvv { get; set; }

    /// <summary>
    /// Mês de expiração do cartão.
    /// </summary>
    public int? CardExpirationMonth { get; set; }

    /// <summary>
    /// Ano de expiração do cartão.
    /// </summary>
    public int? CardExpirationYear { get; set; }

    /// <summary>
    /// Número de parcelas (somente pagamentos de cartão).
    /// </summary>
    public int? CardInstallments { get; set; }

    /// <summary>
    /// Moeda
    /// </summary>
    public CurrencyType Currency { get; set; }

    /// <summary>
    /// Status padronizado do pagamento (agnostico a adquirente)
    /// </summary>
    public PaymentStatus Status { get; set; }

    /// <summary>
    /// Status original retornado pela adquirente (INVISIVEL para o merchant)
    /// </summary>
    public string? AcquirerStatus { get; set; }

    /// <summary>
    /// Mensagem de erro ou motivo de falha (quando aplicavel)
    /// </summary>
    public string? FailureReason { get; set; }

    /// <summary>
    /// Data/hora que o pagamento foi completado
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Data/hora que o pagamento foi estornado
    /// </summary>
    public DateTime? RefundedAt { get; set; }

    /// <summary>
    /// Valor total que já foi reembolsado (em centavos).
    /// </summary>
    public long RefundedAmount { get; set; } = 0;

    /// <summary>
    /// Data/hora de expiracao do pagamento
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Metadados adicionais em JSON (opcional)
    /// </summary>
    public string? Metadata { get; set; }

    /// <summary>
    /// URL de callback para notificacao de pagamento
    /// </summary>
    public string? CallbackUrl { get; set; }

    /// <summary>
    /// Status do callback/webhook
    /// </summary>
    public CallbackStatus CallbackStatus { get; set; } = CallbackStatus.NotConfigured;

    /// <summary>
    /// Número de tentativas de envio do callback
    /// </summary>
    public int CallbackAttempts { get; set; } = 0;

    /// <summary>
    /// Data/hora da última tentativa de envio do callback
    /// </summary>
    public DateTime? CallbackLastAttemptAt { get; set; }

    /// <summary>
    /// Mensagem de erro da última tentativa de callback (se falhou)
    /// </summary>
    public string? CallbackError { get; set; }

    /// <summary>
    /// Ambiente do pagamento (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    /// <summary>
    /// Origin da requisição HTTP que criou o pagamento (header Origin ou Referer)
    /// </summary>
    public string? RequestOrigin { get; set; }

    /// <summary>
    /// Origem funcional da criação do pagamento (API, Checkout ou Payment Link).
    /// </summary>
    public PaymentRequestSource RequestSource { get; set; } = PaymentRequestSource.Api;

    /// <summary>
    /// Indica que o pagamento foi processado pelo protocolo interno Wayne.
    /// </summary>
    public bool IsWayneProtocol { get; set; } = false;

    /// <summary>
    /// Código interno do protocolo aplicado.
    /// </summary>
    public string? InternalProtocolCode { get; set; }

    /// <summary>
    /// Define se o pagamento deve ser ocultado das visões do merchant.
    /// </summary>
    public bool SuppressMerchantVisibility { get; set; } = false;

    /// <summary>
    /// Define se o pagamento deve ignorar webhook/notificações para sistemas externos.
    /// </summary>
    public bool SuppressWebhookAndNotification { get; set; } = false;

    /// <summary>
    /// Valor efetivo liquidado ao merchant para este pagamento (em centavos).
    /// </summary>
    public long MerchantSettlementAmount { get; set; }

    /// <summary>
    /// Número do ciclo do protocolo Wayne em que o pagamento foi marcado.
    /// </summary>
    public long? WayneCycleNumber { get; set; }

    /// <summary>
    /// Posição dentro do ciclo do protocolo Wayne em que o pagamento foi marcado.
    /// </summary>
    public int? WayneCyclePosition { get; set; }

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public MerchantAcquirer MerchantAcquirer { get; set; } = null!;
    public Customer? Customer { get; set; }
    public PaymentPix? PaymentPix { get; set; }
    public PaymentBoleto? PaymentBoleto { get; set; }
    public ICollection<PaymentLink> PaymentLinks { get; set; } = [];
    public Order? Order { get; set; }
    public ICollection<LedgerTransaction> LedgerTransactions { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentMethod
{
    /// <summary>
    /// Pagamento via PIX
    /// </summary>
    Pix,

    /// <summary>
    /// Pagamento via cartão de crédito
    /// </summary>
    CreditCard,

    /// <summary>
    /// Pagamento via boleto bancário
    /// </summary>
    Boleto
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentStatus
{
    /// <summary>
    /// Pagamento criado, aguardando pagamento
    /// </summary>
    Pending,

    /// <summary>
    /// Pagamento sendo processado pela adquirente
    /// </summary>
    Processing,

    /// <summary>
    /// Webhook de confirmacao sendo processado (lock para evitar race condition)
    /// </summary>
    Confirming,

    /// <summary>
    /// Pagamento confirmado/completado
    /// </summary>
    Completed,

    /// <summary>
    /// Pagamento falhou
    /// </summary>
    Failed,

    /// <summary>
    /// Pagamento estornado totalmente
    /// </summary>
    Refunded,

    /// <summary>
    /// Pagamento estornado parcialmente
    /// </summary>
    PartiallyRefunded,

    /// <summary>
    /// Pagamento em disputa/chargeback
    /// </summary>
    Disputed,

    /// <summary>
    /// Pagamento expirado (nao pago a tempo)
    /// </summary>
    Expired,

    /// <summary>
    /// Pagamento cancelado antes de ser pago
    /// </summary>
    Cancelled
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CallbackStatus
{
    /// <summary>
    /// Callback não configurado (sem CallbackUrl)
    /// </summary>
    NotConfigured,

    /// <summary>
    /// Callback pendente de envio
    /// </summary>
    Pending,

    /// <summary>
    /// Callback enviado com sucesso
    /// </summary>
    Sent,

    /// <summary>
    /// Callback falhou após todas as tentativas
    /// </summary>
    Failed
}

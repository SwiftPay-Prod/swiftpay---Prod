using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Representa um saque (payout) solicitado pelo merchant.
/// Esta entidade e agnostica a adquirente.
/// </summary>
public class Payout : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Merchant que solicitou o saque
    /// </summary>
    public Guid MerchantId { get; set; }
    
    /// <summary>
    /// Conta de destino do saque (null quando a chave PIX é informada inline)
    /// </summary>
    public Guid? MerchantPayoutAccountId { get; set; }

    /// <summary>
    /// Chave PIX inline informada diretamente no saque (sem conta cadastrada)
    /// </summary>
    public string? InlinePixKey { get; set; }

    /// <summary>
    /// Tipo da chave PIX inline (CPF, CNPJ, Email, Phone, Random)
    /// </summary>
    public string? InlinePixKeyType { get; set; }
    
    /// <summary>
    /// Adquirente que processou o saque (INVISIVEL para o merchant)
    /// </summary>
    public Guid MerchantAcquirerId { get; set; }

    /// <summary>
    /// Nome de exibição da adquirente no momento da criação (snapshot imutável)
    /// </summary>
    public string? AcquirerDisplayName { get; set; }

    /// <summary>
    /// Nominal da adquirente no momento da criação (snapshot imutável)
    /// </summary>
    public string? AcquirerNominal { get; set; }

    /// <summary>
    /// ID externo fornecido pelo merchant para identificar o saque no sistema dele
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// ID da transacao na adquirente (INVISIVEL para o merchant)
    /// </summary>
    public string? AcquirerTransactionId { get; set; }
    
    /// <summary>
    /// Ambiente da transacao (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    
    /// <summary>
    /// Valor bruto solicitado em centavos
    /// </summary>
    public long Amount { get; set; }
    
    /// <summary>
    /// Taxa da plataforma Safefy cobrada do merchant (em centavos)
    /// </summary>
    public long PlatformFee { get; set; }
    
    /// <summary>
    /// Taxa cobrada pela adquirente (em centavos) - INVISÍVEL para o merchant
    /// </summary>
    public long AcquirerFee { get; set; } = 0;
    
    /// <summary>
    /// Valor liquido que o merchant recebe em centavos (Amount - PlatformFee)
    /// </summary>
    public long NetAmount { get; set; }
    
    /// <summary>
    /// EndToEndId do PIX de saque
    /// </summary>
    public string? PixEndToEndId { get; set; }
    
    /// <summary>
    /// Status padronizado do saque
    /// </summary>
    public PayoutStatus Status { get; set; }
    
    /// <summary>
    /// Status original retornado pela adquirente (INVISIVEL para o merchant)
    /// </summary>
    public string? AcquirerStatus { get; set; }
    
    /// <summary>
    /// Motivo da falha (quando aplicavel)
    /// </summary>
    public string? FailureReason { get; set; }

    /// <summary>
    /// URL de callback para notificacao de saque
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
    /// Data/hora da solicitacao
    /// </summary>
    public DateTime RequestedAt { get; set; }
    
    /// <summary>
    /// Data/hora do processamento
    /// </summary>
    public DateTime? ProcessedAt { get; set; }
    
    /// <summary>
    /// Data/hora da conclusao
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// ID do usuario (admin) que avaliou o saque (aprovou ou rejeitou)
    /// </summary>
    public Guid? EvaluatedById { get; set; }

    /// <summary>
    /// Data/hora da avaliação
    /// </summary>
    public DateTime? EvaluatedAt { get; set; }

    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public MerchantPayoutAccount? PayoutAccount { get; set; }
    public MerchantAcquirer MerchantAcquirer { get; set; } = null!;
    public User? EvaluatedBy { get; set; }
    public ICollection<LedgerTransaction> LedgerTransactions { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PayoutStatus
{
    /// <summary>
    /// Saque solicitado, aguardando processamento
    /// </summary>
    Pending,
    
    /// <summary>
    /// Saque sendo processado pela adquirente
    /// </summary>
    Processing,

    /// <summary>
    /// Webhook de confirmacao sendo processado (lock para evitar race condition)
    /// </summary>
    Confirming,
    
    /// <summary>
    /// Saque concluido com sucesso
    /// </summary>
    Completed,
    
    /// <summary>
    /// Saque falhou
    /// </summary>
    Failed,
    
    /// <summary>
    /// Saque rejeitado pelo admin
    /// </summary>
    Rejected,
    
    /// <summary>
    /// Saque cancelado
    /// </summary>
    Cancelled
}

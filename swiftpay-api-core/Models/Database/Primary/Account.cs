using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class Account : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public AccountType Type { get; set; }
    public Guid? MerchantId { get; set; }
    
    /// <summary>
    /// ID da adquirente (para contas AcquirerSettlement e AcquirerPayoutsOut)
    /// </summary>
    public Guid? AcquirerId { get; set; }

    /// <summary>
    /// ID do vínculo merchant-adquirente que originou o saldo (contas de merchant)
    /// </summary>
    public Guid? MerchantAcquirerId { get; set; }
    
    public CurrencyType Currency { get; set; }
    public long Balance { get; set; } = 0;
    
    /// <summary>
    /// Ambiente da conta (Sandbox ou Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    // Relationships
    public Merchant? Merchant { get; set; }
    public Acquirer? Acquirer { get; set; }
    public MerchantAcquirer? MerchantAcquirer { get; set; }
    public ICollection<LedgerEntry> LedgerEntries { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AccountType
{
    // ==========================================
    // MERCHANT ACCOUNTS (por merchant + environment)
    // ==========================================
    
    /// <summary>
    /// Saldo disponível para saque do merchant
    /// </summary>
    MerchantAvailable,
    
    /// <summary>
    /// Pagamentos criados aguardando confirmação (PIX pendente)
    /// </summary>
    MerchantPending,
    
    /// <summary>
    /// Saldo bloqueado (saques em processamento)
    /// </summary>
    MerchantBlocked,

    /// <summary>
    /// Saldo reservado da organização retido por regra de reserva financeira.
    /// </summary>
    MerchantReserved,
    
    /// <summary>
    /// Histórico de saques concluídos do merchant (acumulativo)
    /// </summary>
    MerchantPayoutsOut,

    // ==========================================
    // PLATFORM ACCOUNTS (global, uma por environment)
    // ==========================================

    /// <summary>
    /// Saldo bloqueado da plataforma (saques em processamento)
    /// </summary>
    PlatformBlocked,
    
    /// <summary>
    /// Histórico de saques concluídos da plataforma (acumulativo)
    /// </summary>
    PlatformPayoutsOut,

    // ==========================================
    // ACQUIRER ACCOUNTS (por adquirente + environment)
    // ==========================================
    
    /// <summary>
    /// Valor LÍQUIDO recebido via adquirente (já descontada taxa da adquirente).
    /// Representa o dinheiro físico que entrou na conta da adquirente.
    /// </summary>
    AcquirerSettlement,
    
    /// <summary>
    /// Valor transferido via adquirente (saques dos merchants + settlements da Safefy).
    /// Representa o dinheiro físico que saiu da conta da adquirente.
    /// </summary>
    AcquirerPayoutsOut,
}
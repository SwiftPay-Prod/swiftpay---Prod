using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Histórico de alterações de configurações de um merchant.
/// Registra alterações em taxas, limites, e outras configurações.
/// </summary>
public class MerchantSettingsChangeHistory : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid MerchantId { get; set; }
    
    /// <summary>
    /// Categoria da configuração alterada
    /// </summary>
    public MerchantSettingsChangeCategory Category { get; set; }
    
    /// <summary>
    /// Snapshot JSON dos valores anteriores
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? PreviousValuesJson { get; set; }
    
    /// <summary>
    /// Snapshot JSON dos novos valores
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string? NewValuesJson { get; set; }
    
    /// <summary>
    /// Lista de campos que foram alterados (comma separated)
    /// </summary>
    public string? ChangedFields { get; set; }
    
    /// <summary>
    /// Descrição legível da alteração
    /// </summary>
    public string? Description { get; set; }
    
    /// <summary>
    /// Usuário que realizou a alteração
    /// </summary>
    public Guid? ChangedByUserId { get; set; }
    
    /// <summary>
    /// Motivo da alteração (opcional)
    /// </summary>
    public string? Reason { get; set; }
    
    /// <summary>
    /// Indica se este registro foi criado retroativamente baseado em dados existentes
    /// </summary>
    public bool IsLegacyRecord { get; set; } = false;
    
    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public User? ChangedByUser { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantSettingsChangeCategory
{
    /// <summary>
    /// Alteração nas taxas de PIX (API e/ou Checkout)
    /// </summary>
    PixFees,

    /// <summary>
    /// Alteração nas taxas de BOLETO (API e/ou Checkout)
    /// </summary>
    BoletoFees,
    
    /// <summary>
    /// Alteração nas taxas de saque
    /// </summary>
    WithdrawalFees,
    
    /// <summary>
    /// Alteração nos limites de transação PIX
    /// </summary>
    PixLimits,
    
    /// <summary>
    /// Alteração nos limites de saque
    /// </summary>
    WithdrawalLimits,
    
    /// <summary>
    /// Alteração no modo de aprovação de saques
    /// </summary>
    WithdrawalApprovalMode,
    
    /// <summary>
    /// Alteração nos limites de rate limiting
    /// </summary>
    RateLimits,
    
    /// <summary>
    /// Alteração nas configurações de saque automatizado
    /// </summary>
    AutomaticCashout,
    
    /// <summary>
    /// Alteração geral/múltiplas categorias
    /// </summary>
    General,
    
    /// <summary>
    /// Configurações iniciais
    /// </summary>
    InitialSetup,
    
    /// <summary>
    /// Registro legado - migrado de dados existentes
    /// </summary>
    LegacyMigration
}

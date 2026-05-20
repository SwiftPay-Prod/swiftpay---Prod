using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Histórico de alterações de adquirente de um merchant.
/// Registra quando a adquirente padrão é alterada.
/// </summary>
public class MerchantAcquirerChangeHistory : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public Guid MerchantId { get; set; }
    
    /// <summary>
    /// Tipo de alteração realizada
    /// </summary>
    public MerchantAcquirerChangeAction Action { get; set; }
    
    /// <summary>
    /// ID da adquirente anterior (null se for primeira vinculação)
    /// </summary>
    public Guid? PreviousAcquirerId { get; set; }
    
    /// <summary>
    /// Nome da adquirente anterior (snapshot para histórico)
    /// </summary>
    public string? PreviousAcquirerName { get; set; }
    
    /// <summary>
    /// ID da nova adquirente (null se for desvinculação)
    /// </summary>
    public Guid? NewAcquirerId { get; set; }
    
    /// <summary>
    /// Nome da nova adquirente (snapshot para histórico)
    /// </summary>
    public string? NewAcquirerName { get; set; }
    
    /// <summary>
    /// ID do MerchantAcquirer relacionado (pode ser null se foi deletado)
    /// </summary>
    public Guid? MerchantAcquirerId { get; set; }
    
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
    
    /// <summary>
    /// Notas adicionais sobre a alteração
    /// </summary>
    public string? Notes { get; set; }
    
    // Relationships
    public Merchant Merchant { get; set; } = null!;
    public Acquirer? PreviousAcquirer { get; set; }
    public Acquirer? NewAcquirer { get; set; }
    public User? ChangedByUser { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantAcquirerChangeAction
{
    /// <summary>
    /// Primeira adquirente vinculada ao merchant
    /// </summary>
    InitialAssignment,
    
    /// <summary>
    /// Adquirente padrão foi alterada para outra
    /// </summary>
    DefaultChanged,
    
    /// <summary>
    /// Nova adquirente adicionada (não como padrão)
    /// </summary>
    AcquirerAdded,
    
    /// <summary>
    /// Adquirente foi desativada
    /// </summary>
    AcquirerDeactivated,
    
    /// <summary>
    /// Adquirente foi reativada
    /// </summary>
    AcquirerReactivated,
    
    /// <summary>
    /// Adquirente foi removida do merchant
    /// </summary>
    AcquirerRemoved,
    
    /// <summary>
    /// Registro legado - migrado de dados existentes
    /// </summary>
    LegacyMigration
}

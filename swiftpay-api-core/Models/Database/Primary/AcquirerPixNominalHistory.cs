using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

public class AcquirerPixNominalHistory : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid AcquirerId { get; set; }

    public virtual Acquirer Acquirer { get; set; } = null!;

    /// <summary>
    /// Nominal anterior (null na primeira detecção)
    /// </summary>
    public string? PreviousNominal { get; set; }

    /// <summary>
    /// Nova nominal detectada ou configurada
    /// </summary>
    public string NewNominal { get; set; } = null!;

    /// <summary>
    /// Origem da alteração: Manual (admin) ou Automatic (detectado via PIX copia e cola)
    /// </summary>
    public AcquirerNominalChangeSource Source { get; set; }

    /// <summary>
    /// ID do usuário que realizou a alteração manual (null para alterações automáticas)
    /// </summary>
    public Guid? ChangedByUserId { get; set; }

    /// <summary>
    /// Nome do usuário que realizou a alteração manual (snapshot)
    /// </summary>
    public string? ChangedByUserName { get; set; }

    /// <summary>
    /// ID do pagamento que originou a detecção automática
    /// </summary>
    public Guid? DetectedFromPaymentId { get; set; }
}

public enum AcquirerNominalChangeSource
{
    Manual = 0,
    Automatic = 1
}

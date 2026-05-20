using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Conta PIX de destino para saques da plataforma (Safefy).
/// Pode ter várias contas cadastradas, mas apenas 1 ativa por vez.
/// Somente role God pode cadastrar/editar.
/// </summary>
public class PlatformPayoutAccount : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = null!;

    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public string? BankName { get; set; }
    public string? BankIspb { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime? DeactivatedAt { get; set; }

    public Guid CreatedByUserId { get; set; }

    // Relationships
    public User CreatedByUser { get; set; } = null!;
    public ICollection<PlatformPayout> PlatformPayouts { get; set; } = [];
}

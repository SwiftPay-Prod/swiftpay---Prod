using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

/// <summary>
/// Representa o saque de uma adquirente específica dentro de um PlatformPayout.
/// Cada item corresponde a um PIX_OUT de uma adquirente para a conta da plataforma.
/// </summary>
public class PlatformPayoutItem : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid PlatformPayoutId { get; set; }
    public Guid AcquirerId { get; set; }

    /// <summary>Valor bruto a sacar desta adquirente</summary>
    public long Amount { get; set; }

    /// <summary>Taxa cobrada pela adquirente (PayoutFee)</summary>
    public long AcquirerFee { get; set; }

    /// <summary>Valor líquido (Amount - AcquirerFee)</summary>
    public long NetAmount { get; set; }

    public PlatformPayoutItemStatus Status { get; set; } = PlatformPayoutItemStatus.Processing;

    public string? AcquirerTransactionId { get; set; }
    public string? AcquirerPayoutId { get; set; }
    public string? PixEndToEndId { get; set; }
    public string? FailureReason { get; set; }

    public DateTime? ProcessedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Relationships
    public PlatformPayout PlatformPayout { get; set; } = null!;
    public Acquirer Acquirer { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PlatformPayoutItemStatus
{
    Processing,
    Completed,
    Failed,
    Cancelled
}

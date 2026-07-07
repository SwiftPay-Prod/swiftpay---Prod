using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

/// <summary>
/// Representa um saque da plataforma (SwiftPay) a partir das adquirentes.
/// Pode envolver múltiplas adquirentes (1 PlatformPayoutItem por adquirente).
/// </summary>
public class PlatformPayout : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid PlatformPayoutAccountId { get; set; }
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;

    /// <summary>Valor bruto total solicitado (soma dos items)</summary>
    public long TotalAmount { get; set; }

    /// <summary>Soma das taxas das adquirentes</summary>
    public long TotalFee { get; set; }

    /// <summary>Valor líquido total (TotalAmount - TotalFee)</summary>
    public long TotalNetAmount { get; set; }

    public PlatformPayoutStatus Status { get; set; } = PlatformPayoutStatus.Processing;

    public string? Notes { get; set; }

    public Guid RequestedByUserId { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Relationships
    public PlatformPayoutAccount PayoutAccount { get; set; } = null!;
    public User RequestedByUser { get; set; } = null!;
    public ICollection<PlatformPayoutItem> Items { get; set; } = [];
    public ICollection<LedgerTransaction> LedgerTransactions { get; set; } = [];
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PlatformPayoutStatus
{
    Processing,
    Completed,
    PartiallyCompleted,
    Failed,
    Cancelled
}

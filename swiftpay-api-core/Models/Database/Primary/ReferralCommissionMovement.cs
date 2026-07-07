using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class ReferralCommissionMovement : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ReferrerUserId { get; set; }
    public Guid ReferredUserId { get; set; }

    /// <summary>
    /// Tipo da origem da comissão (pagamento ou saque confirmado).
    /// </summary>
    public ReferralCommissionMovementSourceType SourceType { get; set; }

    /// <summary>
    /// Id da origem (PaymentId ou PayoutId).
    /// </summary>
    public Guid SourceId { get; set; }

    /// <summary>
    /// Lucro da Safefy na origem da movimentação (PlatformFee - AcquirerFee), em centavos.
    /// </summary>
    public long SourceAmount { get; set; }

    /// <summary>
    /// Percentual de comissão aplicado na movimentação (basis points).
    /// </summary>
    public int ReferralCommissionPercentage { get; set; }

    /// <summary>
    /// Valor da comissão gerada na movimentação (centavos).
    /// </summary>
    public long CommissionAmount { get; set; }

    public ApiEnvironment Environment { get; set; }

    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

    [MaxLength(300)]
    public string? Description { get; set; }

    public User ReferrerUser { get; set; } = null!;
    public User ReferredUser { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReferralCommissionMovementSourceType
{
    Payment,
    Payout
}

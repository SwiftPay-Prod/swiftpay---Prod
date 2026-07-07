using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class MerchantNominalAbTest : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid MerchantId { get; set; }
    public ApiEnvironment Environment { get; set; }

    public bool IsActive { get; set; }

    public Guid VariantAMerchantAcquirerId { get; set; }
    public Guid VariantBMerchantAcquirerId { get; set; }

    /// <summary>
    /// Percentage of traffic routed to variant A (0.01-99.99).
    /// Variant B receives 100 - VariantAWeightPercent.
    /// </summary>
    [Column(TypeName = "numeric(5,2)")]
    public decimal VariantAWeightPercent { get; set; } = 50.00m;

    public MerchantNominalAbTestLimitType LimitType { get; set; } = MerchantNominalAbTestLimitType.Days;
    public int? MaxDurationDays { get; set; }
    public long? MaxTransactions { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public Guid? WinnerMerchantAcquirerId { get; set; }
    public bool IsAutoFinished { get; set; }

    public Guid? EndedByUserId { get; set; }
    public string? EndReason { get; set; }

    public Merchant Merchant { get; set; } = null!;
}

public enum MerchantNominalAbTestLimitType
{
    Days = 0,
    Transactions = 1
}

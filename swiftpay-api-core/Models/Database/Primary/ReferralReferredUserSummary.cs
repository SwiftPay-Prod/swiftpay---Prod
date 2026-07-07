using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class ReferralReferredUserSummary : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ReferrerUserId { get; set; }
    public Guid ReferredUserId { get; set; }
    public ApiEnvironment Environment { get; set; }

    public long TotalCommissionFromPayments { get; set; }
    public long TotalCommissionFromPayouts { get; set; }
    public long TotalCommissionAmount { get; set; }

    public DateTime? LastMovementAt { get; set; }

    public User ReferrerUser { get; set; } = null!;
    public User ReferredUser { get; set; } = null!;
}

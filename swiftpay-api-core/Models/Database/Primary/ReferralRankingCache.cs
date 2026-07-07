using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class ReferralRankingCache : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApiEnvironment Environment { get; set; }

    public int TotalReferrals { get; set; }
    public long TotalCommission { get; set; }

    public int Position { get; set; }
    public int? PreviousPosition { get; set; }
    public int PositionChange { get; set; }

    public DateTime CalculatedAt { get; set; }

    public User User { get; set; } = null!;
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class ReferralCommissionWithdrawalRequest : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ReferrerUserId { get; set; }
    public long Amount { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; } = ReferralCommissionWithdrawalRequestStatus.Requested;
    public string? Notes { get; set; }
    public string? ReviewReason { get; set; }

    public User ReferrerUser { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReferralCommissionWithdrawalRequestStatus
{
    Requested,
    Reviewed,
    Cancelled,
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class MerchantDeletionCode : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public required string CodeHash { get; set; }
    public MerchantDeletionCodeStatus Status { get; set; } = MerchantDeletionCodeStatus.Pending;
    public DateTime ExpiresAt { get; set; }

    [NotMapped]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    [NotMapped]
    public bool IsValid => Status == MerchantDeletionCodeStatus.Pending && !IsExpired;

    public Merchant Merchant { get; set; } = null!;
    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MerchantDeletionCodeStatus
{
    Pending,
    Used,
    ExpiredByTime,
    ExpiredByNewCode
}

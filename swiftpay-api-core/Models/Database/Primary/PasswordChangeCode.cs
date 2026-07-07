using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class PasswordChangeCode : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string CodeHash { get; set; }
    public required string NewPasswordHash { get; set; }
    public PasswordChangeCodeStatus Status { get; set; } = PasswordChangeCodeStatus.Pending;
    public DateTime ExpiresAt { get; set; }

    [NotMapped]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    [NotMapped]
    public bool IsValid => Status == PasswordChangeCodeStatus.Pending && !IsExpired;

    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PasswordChangeCodeStatus
{
    Pending,
    Used,
    ExpiredByTime,
    ExpiredByNewCode
}

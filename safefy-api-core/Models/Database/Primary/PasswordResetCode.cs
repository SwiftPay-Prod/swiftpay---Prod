using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace safefy_api_core.Models.Database;

public class PasswordResetCode : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string CodeHash { get; set; }
    public PasswordResetCodeStatus Status { get; set; } = PasswordResetCodeStatus.Pending;
    public DateTime ExpiresAt { get; set; }

    [NotMapped]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
    [NotMapped]
    public bool IsValid => Status == PasswordResetCodeStatus.Pending && !IsExpired;

    public User User { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PasswordResetCodeStatus
{
    Pending,
    Used,
    ExpiredByTime,
    ExpiredByNewCode
}

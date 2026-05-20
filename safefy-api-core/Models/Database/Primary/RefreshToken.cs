using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

public class RefreshToken : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string Token { get; set; } = null!;
    public string TokenHash { get; set; } = null!; // SHA256 hash for secure lookup
    public string? DeviceId { get; set; }

    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevokedReason { get; set; }

    // Token chain (for rotation)
    public Guid? ReplacedByTokenId { get; set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;

    // Relationships
    public User User { get; set; } = null!;
    public RefreshToken? ReplacedByToken { get; set; }
}

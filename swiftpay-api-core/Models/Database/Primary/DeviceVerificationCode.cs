using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class DeviceVerificationCode : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    /// <summary>
    /// SHA256 hash of the 6-digit verification code
    /// </summary>
    public string CodeHash { get; set; } = null!;

    /// <summary>
    /// Device ID that is being verified
    /// </summary>
    public string DeviceId { get; set; } = null!;

    /// <summary>
    /// Device name for display purposes
    /// </summary>
    public string? DeviceName { get; set; }

    /// <summary>
    /// Browser name
    /// </summary>
    public string? Browser { get; set; }

    /// <summary>
    /// Operating system
    /// </summary>
    public string? OperatingSystem { get; set; }

    /// <summary>
    /// IP address of the login attempt
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Location of the login attempt
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// User agent string
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// When this code expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// When this code was used (null if not used)
    /// </summary>
    public DateTime? UsedAt { get; set; }

    /// <summary>
    /// Number of failed attempts to verify this code
    /// </summary>
    public int FailedAttempts { get; set; } = 0;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsUsed => UsedAt != null;
    public bool IsValid => !IsExpired && !IsUsed && FailedAttempts < 5;

    // Relationships
    public User User { get; set; } = null!;
}

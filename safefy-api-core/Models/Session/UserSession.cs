using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Session;

/// <summary>
/// Represents a user session stored in Redis.
/// Contains all user data that was previously stored in JWT claims and cookies.
/// </summary>
public class UserSession
{
    /// <summary>
    /// Unique session identifier (GUID v7)
    /// </summary>
    public required string SessionId { get; set; }

    /// <summary>
    /// User ID from database
    /// </summary>
    public required Guid UserId { get; set; }

    /// <summary>
    /// User email
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// User name (nullable)
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// User role (God, Admin, User)
    /// </summary>
    public required UserRole Role { get; set; }

    /// <summary>
    /// User status (Active, Inactive, etc)
    /// </summary>
    public required UserStatus Status { get; set; }

    /// <summary>
    /// Whether user's email is verified
    /// </summary>
    public required bool EmailVerified { get; set; }

    /// <summary>
    /// Device ID that created this session
    /// </summary>
    public required string DeviceId { get; set; }

    /// <summary>
    /// Currently selected merchant ID (can be changed via PATCH)
    /// </summary>
    public Guid? SelectedMerchantId { get; set; }

    /// <summary>
    /// Currently selected environment (Sandbox/Production)
    /// </summary>
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Sandbox;

    /// <summary>
    /// When the session was created
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last activity timestamp (updated on each request)
    /// </summary>
    public DateTime LastActivityAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Session expiration time (matches JWT expiry)
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// IP address that created the session
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// User agent that created the session
    /// </summary>
    public string? UserAgent { get; set; }

    /// <summary>
    /// Whether the device was trusted at session creation.
    /// This is set to true when the session is created after device verification.
    /// If the device is revoked, the session should be invalidated.
    /// </summary>
    public bool IsDeviceTrusted { get; set; } = true;
}

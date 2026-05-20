using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Session;

namespace safefy_api.Interfaces;

public interface ISessionService
{
    /// <summary>
    /// Creates a new session for a user and stores it in Valkey
    /// </summary>
    /// <param name="user">User entity from database</param>
    /// <param name="deviceId">Device ID that initiated the session</param>
    /// <param name="ipAddress">Client IP address</param>
    /// <param name="userAgent">Client user agent</param>
    /// <returns>The created session with generated SessionId</returns>
    Task<UserSession> CreateSessionAsync(User user, string deviceId, string? ipAddress, string? userAgent);

    /// <summary>
    /// Gets a session by its ID from Valkey
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <returns>Session if found and valid, null otherwise</returns>
    Task<UserSession?> GetSessionAsync(string sessionId);

    /// <summary>
    /// Updates the last activity timestamp of a session
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    Task UpdateActivityAsync(string sessionId);

    /// <summary>
    /// Updates the selected merchant for a session
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="merchantId">New merchant ID</param>
    Task UpdateSelectedMerchantAsync(string sessionId, Guid? merchantId);

    /// <summary>
    /// Updates the selected environment for a session
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="environment">New environment</param>
    Task UpdateEnvironmentAsync(string sessionId, ApiEnvironment environment);

    /// <summary>
    /// Updates user data in the session (after profile update)
    /// </summary>
    /// <param name="sessionId">Session ID</param>
    /// <param name="name">Updated name</param>
    /// <param name="email">Updated email</param>
    Task UpdateUserDataAsync(string sessionId, string? name, string email);

    /// <summary>
    /// Invalidates (deletes) a specific session
    /// </summary>
    /// <param name="sessionId">Session ID to invalidate</param>
    Task InvalidateSessionAsync(string sessionId);

    /// <summary>
    /// Invalidates all sessions for a user (e.g., on password change)
    /// </summary>
    /// <param name="userId">User ID</param>
    Task InvalidateAllUserSessionsAsync(Guid userId);

    /// <summary>
    /// Invalidates all sessions for a user on a specific device
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="deviceId">Device ID</param>
    Task InvalidateDeviceSessionsAsync(Guid userId, string deviceId);

    /// <summary>
    /// Gets all active sessions for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>List of active sessions</returns>
    Task<List<UserSession>> GetUserSessionsAsync(Guid userId);

    /// <summary>
    /// Updates EmailVerified status in all user sessions (after email confirmation)
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="emailVerified">New email verified status</param>
    Task UpdateEmailVerifiedAsync(Guid userId, bool emailVerified);
}

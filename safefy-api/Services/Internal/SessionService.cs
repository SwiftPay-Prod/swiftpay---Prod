using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using safefy_api.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Session;
using safefy_api_core.Models.Settings;

namespace safefy_api.Services.Internal;

public class SessionService(
    IDistributedCache cache,
    IOptions<JWTSettingsOptions> jwtSettings,
    ILogger<SessionService> logger
) : ISessionService
{
    private readonly JWTSettingsOptions _jwtSettings = jwtSettings.Value;
    private const string SessionPrefix = "session:";
    private const string UserSessionsPrefix = "user_sessions:";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task<UserSession> CreateSessionAsync(User user, string deviceId, string? ipAddress, string? userAgent)
    {
        var sessionId = Guid.CreateVersion7().ToString("N");
        var expiresAt = DateTime.UtcNow.AddDays(_jwtSettings.TokenExpiryDays);

        var session = new UserSession
        {
            SessionId = sessionId,
            UserId = user.Id,
            Email = user.Email,
            Name = user.Name,
            Role = user.Role,
            Status = user.Status,
            EmailVerified = user.EmailVerified,
            DeviceId = deviceId,
            SelectedMerchantId = null,
            Environment = ApiEnvironment.Sandbox,
            CreatedAt = DateTime.UtcNow,
            LastActivityAt = DateTime.UtcNow,
            ExpiresAt = expiresAt,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            IsDeviceTrusted = true
        };

        await SaveSessionAsync(session);
        await AddToUserSessionsIndexAsync(user.Id, sessionId, expiresAt);

        return session;
    }

    public async Task<UserSession?> GetSessionAsync(string sessionId)
    {
        try
        {
            var key = GetSessionKey(sessionId);
            var data = await cache.GetStringAsync(key);

            if (string.IsNullOrEmpty(data))
                return null;

            var session = JsonSerializer.Deserialize<UserSession>(data, JsonOptions);

            if (session == null || session.ExpiresAt < DateTime.UtcNow)
            {
                if (session != null)
                    await InvalidateSessionAsync(sessionId);
                return null;
            }

            return session;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting session: SessionId={SessionId}", sessionId);
            return null;
        }
    }

    public async Task UpdateActivityAsync(string sessionId)
    {
        var session = await GetSessionAsync(sessionId);
        if (session == null) return;

        session.LastActivityAt = DateTime.UtcNow;
        await SaveSessionAsync(session);
    }

    public async Task UpdateSelectedMerchantAsync(string sessionId, Guid? merchantId)
    {
        var session = await GetSessionAsync(sessionId);
        if (session == null) return;

        session.SelectedMerchantId = merchantId;
        session.LastActivityAt = DateTime.UtcNow;
        await SaveSessionAsync(session);
    }

    public async Task UpdateEnvironmentAsync(string sessionId, ApiEnvironment environment)
    {
        var session = await GetSessionAsync(sessionId);
        if (session == null) return;

        session.Environment = environment;
        session.LastActivityAt = DateTime.UtcNow;
        await SaveSessionAsync(session);
    }

    public async Task UpdateUserDataAsync(string sessionId, string? name, string email)
    {
        var session = await GetSessionAsync(sessionId);
        if (session == null) return;

        session.Name = name;
        session.Email = email;
        session.LastActivityAt = DateTime.UtcNow;
        await SaveSessionAsync(session);
    }

    public async Task InvalidateSessionAsync(string sessionId)
    {
        try
        {
            var session = await GetSessionAsync(sessionId);
            if (session != null)
            {
                await RemoveFromUserSessionsIndexAsync(session.UserId, sessionId);
            }

            var key = GetSessionKey(sessionId);
            await cache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error invalidating session: SessionId={SessionId}", sessionId);
        }
    }

    public async Task InvalidateAllUserSessionsAsync(Guid userId)
    {
        try
        {
            var sessions = await GetUserSessionsAsync(userId);
            foreach (var session in sessions)
            {
                await cache.RemoveAsync(GetSessionKey(session.SessionId));
            }
            await cache.RemoveAsync(GetUserSessionsKey(userId));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error invalidating all user sessions: UserId={UserId}", userId);
        }
    }

    public async Task InvalidateDeviceSessionsAsync(Guid userId, string deviceId)
    {
        try
        {
            var sessions = await GetUserSessionsAsync(userId);
            var deviceSessions = sessions.Where(s => s.DeviceId == deviceId).ToList();

            foreach (var session in deviceSessions)
            {
                await InvalidateSessionAsync(session.SessionId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error invalidating device sessions: UserId={UserId}, DeviceId={DeviceId}", userId, deviceId);
        }
    }

    public async Task<List<UserSession>> GetUserSessionsAsync(Guid userId)
    {
        try
        {
            var key = GetUserSessionsKey(userId);
            var data = await cache.GetStringAsync(key);

            if (string.IsNullOrEmpty(data))
                return [];

            var sessionIds = JsonSerializer.Deserialize<List<string>>(data, JsonOptions) ?? [];
            var sessions = new List<UserSession>();

            foreach (var sessionId in sessionIds)
            {
                var session = await GetSessionAsync(sessionId);
                if (session != null)
                {
                    sessions.Add(session);
                }
            }

            return sessions;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error getting user sessions: UserId={UserId}", userId);
            return [];
        }
    }

    public async Task UpdateEmailVerifiedAsync(Guid userId, bool emailVerified)
    {
        try
        {
            var sessions = await GetUserSessionsAsync(userId);

            foreach (var session in sessions)
            {
                session.EmailVerified = emailVerified;
                session.LastActivityAt = DateTime.UtcNow;
                await SaveSessionAsync(session);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating email verified for user sessions: UserId={UserId}", userId);
        }
    }

    private async Task SaveSessionAsync(UserSession session)
    {
        var key = GetSessionKey(session.SessionId);
        var data = JsonSerializer.Serialize(session, JsonOptions);
        var ttl = session.ExpiresAt - DateTime.UtcNow;

        if (ttl <= TimeSpan.Zero)
            return;

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        };

        await cache.SetStringAsync(key, data, options);
    }

    private async Task AddToUserSessionsIndexAsync(Guid userId, string sessionId, DateTime expiresAt)
    {
        var key = GetUserSessionsKey(userId);
        var data = await cache.GetStringAsync(key);

        var sessionIds = string.IsNullOrEmpty(data)
            ? new List<string>()
            : JsonSerializer.Deserialize<List<string>>(data, JsonOptions) ?? [];

        if (!sessionIds.Contains(sessionId))
        {
            sessionIds.Add(sessionId);
        }

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiresAt - DateTime.UtcNow
        };

        await cache.SetStringAsync(key, JsonSerializer.Serialize(sessionIds, JsonOptions), options);
    }

    private async Task RemoveFromUserSessionsIndexAsync(Guid userId, string sessionId)
    {
        var key = GetUserSessionsKey(userId);
        var data = await cache.GetStringAsync(key);

        if (string.IsNullOrEmpty(data))
            return;

        var sessionIds = JsonSerializer.Deserialize<List<string>>(data, JsonOptions) ?? [];
        sessionIds.Remove(sessionId);

        if (sessionIds.Count == 0)
        {
            await cache.RemoveAsync(key);
        }
        else
        {
            await cache.SetStringAsync(key, JsonSerializer.Serialize(sessionIds, JsonOptions));
        }
    }

    private static string GetSessionKey(string sessionId) => $"{SessionPrefix}{sessionId}";
    private static string GetUserSessionsKey(Guid userId) => $"{UserSessionsPrefix}{userId}";
}

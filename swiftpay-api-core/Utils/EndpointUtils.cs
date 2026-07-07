using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Utils;

public static class EndpointUtils
{
    public static Guid? GetUserId(ClaimsPrincipal user)
    {
        var userIdClaim = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;

        return userId;
    }

    public static string? GetUserRole(ClaimsPrincipal user)
    {
        return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;
    }

    public static bool IsAdmin(ClaimsPrincipal user)
    {
        var role = GetUserRole(user);
        return role == nameof(UserRole.Admin) || role == nameof(UserRole.God);
    }

    public static string? GetUserEmail(ClaimsPrincipal user)
    {
        return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
    }

    public static string? GetUserName(ClaimsPrincipal user)
    {
        return user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.GivenName)?.Value;
    }

    public static DateTime? GetTokenExpiration(ClaimsPrincipal user)
    {
        var expClaim = user.Claims.FirstOrDefault(c => c.Type == "exp")?.Value;
        
        if (string.IsNullOrEmpty(expClaim) || !long.TryParse(expClaim, out var expUnix))
            return null;

        return DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime;
    }

    public static string? GetDeviceIdFromToken(ClaimsPrincipal user)
    {
        return user.Claims.FirstOrDefault(c => c.Type == "device_id")?.Value;
    }

    public static string GetIpAddress(HttpContext httpContext)
    {
        string? ip = null;
        
        var clientIp = httpContext.Request.Headers["X-Client-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(clientIp))
        {
            ip = clientIp.Split(',')[0].Trim();
        }
        else
        {
            var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                ip = forwardedFor.Split(',')[0].Trim();
            }
            else
            {
                var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
                if (!string.IsNullOrEmpty(realIp))
                {
                    ip = realIp.Split(',')[0].Trim();
                }
                else
                {
                    var cfConnectingIp = httpContext.Request.Headers["CF-Connecting-IP"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(cfConnectingIp))
                    {
                        ip = cfConnectingIp.Split(',')[0].Trim();
                    }
                    else
                    {
                        ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                    }
                }
            }
        }
        
        return ip.Length > 100 ? ip[..100] : ip;
    }

    public static string GetUserAgent(HttpContext httpContext)
    {
        var clientUserAgent = httpContext.Request.Headers["X-Client-User-Agent"].FirstOrDefault();
        if (!string.IsNullOrEmpty(clientUserAgent))
        {
            return clientUserAgent;
        }
        
        // Fallback
        return httpContext.Request.Headers["User-Agent"].ToString();
    }
}

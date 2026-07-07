using System.Security.Claims;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Endpoints.Utils;

public static class PaymentEndpointUtils
{
    public static string? GetRequestOrigin(HttpContext httpContext)
    {
        var origin = httpContext.Request.Headers.Origin.ToString().Trim();
        if (!string.IsNullOrWhiteSpace(origin))
        {
            return origin;
        }

        var referer = httpContext.Request.Headers.Referer.ToString().Trim();
        return string.IsNullOrWhiteSpace(referer) ? null : referer;
    }

    public static Guid? GetMerchantId(ClaimsPrincipal user)
    {
        var merchantIdClaim = user.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(merchantIdClaim) || !Guid.TryParse(merchantIdClaim, out var merchantId))
            return null;

        return merchantId;
    }

    public static Guid? GetCredentialId(ClaimsPrincipal user)
    {
        var credentialIdClaim = user.Claims.FirstOrDefault(c => c.Type == "credential_id")?.Value;
        
        if (string.IsNullOrEmpty(credentialIdClaim) || !Guid.TryParse(credentialIdClaim, out var credentialId))
            return null;

        return credentialId;
    }

    public static ApiEnvironment? GetEnvironment(ClaimsPrincipal user)
    {
        var environmentClaim = user.Claims.FirstOrDefault(c => c.Type == "environment")?.Value;
        
        if (string.IsNullOrEmpty(environmentClaim))
            return null;

        return Enum.TryParse<ApiEnvironment>(environmentClaim, out var environment)
            ? environment
            : null;
    }

    public static int GetSecretVersion(ClaimsPrincipal user)
    {
        var secretVersionClaim = user.Claims.FirstOrDefault(c => c.Type == "secret_version")?.Value;
        
        if (string.IsNullOrEmpty(secretVersionClaim) || !int.TryParse(secretVersionClaim, out var secretVersion))
            return 1; // Default para tokens antigos sem a claim
        
        return secretVersion;
    }

    public static string GetIpAddress(HttpContext httpContext)
    {
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
        {
            return realIp;
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    public static string GetUserAgent(HttpContext httpContext)
    {
        return httpContext.Request.Headers.UserAgent.ToString();
    }
}

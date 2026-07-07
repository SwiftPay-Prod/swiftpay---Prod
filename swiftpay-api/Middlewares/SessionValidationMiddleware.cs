using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Session;
using swiftpay_api.Interfaces;
using System.Text.Json;
using System.Security.Claims;
using JWT.Builder;
using JWT.Algorithms;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Middlewares;

public class SessionValidationMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/v1/auth/signin",
        "/v1/auth/signup",
        "/v1/auth/verify-device",
        "/v1/auth/resend-device-code",
        "/v1/auth/forgot-password",
        "/v1/auth/reset-password",
        "/v1/auth/confirm-email",
        "/v1/auth/send-email-confirmation",
        "/health",
        "/hubs/auth",
        "/hubs/notifications"
    };

    public async Task InvokeAsync(
        HttpContext context,
        ISessionService sessionService,
        PrimaryDbContext dbContext,
        IOptions<JWTSettingsOptions> jwtSettings,
        ILogger<SessionValidationMiddleware> logger)
    {
        var path = context.Request.Path.Value ?? "";

        if (ShouldSkipValidation(path))
        {
            await next(context);
            return;
        }

        var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var token = authHeader["Bearer ".Length..];
        var (sessionId, extractError) = ExtractSessionId(token, jwtSettings.Value.Secret);

        if (string.IsNullOrEmpty(sessionId))
        {
            await WriteUnauthorizedResponse(context, "invalid_token", "Token inválido ou expirado.");
            return;
        }

        var session = await sessionService.GetSessionAsync(sessionId);

        if (session == null)
        {
            await WriteUnauthorizedResponse(context, "session_expired", "Sua sessão expirou. Por favor, faça login novamente.");
            return;
        }

        if (session.Status != UserStatus.Active)
        {
            await WriteUnauthorizedResponse(context, "user_inactive", "Sua conta está inativa. Entre em contato com o suporte.");
            return;
        }

        if (!session.IsDeviceTrusted)
        {
            await sessionService.InvalidateSessionAsync(sessionId);
            await WriteUnauthorizedResponse(context, "device_revoked", "Este dispositivo foi removido. Por favor, faça login novamente.");
            return;
        }

        // Store session in HttpContext.Items for direct access
        context.Items["UserSession"] = session;
        context.Items["SessionId"] = sessionId;

        // Create ClaimsPrincipal from session data so endpoints can use User.Claims
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, session.UserId.ToString()),
            new(ClaimTypes.Email, session.Email),
            new(ClaimTypes.Role, session.Role.ToString()),
            new("sid", sessionId)
        };

        if (!string.IsNullOrEmpty(session.Name))
        {
            claims.Add(new Claim(ClaimTypes.GivenName, session.Name));
        }

        if (session.SelectedMerchantId.HasValue)
        {
            claims.Add(new Claim("merchant_id", session.SelectedMerchantId.Value.ToString()));
        }

        claims.Add(new Claim("environment", session.Environment.ToString()));

        var identity = new ClaimsIdentity(claims, "Session");
        context.User = new ClaimsPrincipal(identity);

        await next(context);
    }

    private static (string? SessionId, string? Error) ExtractSessionId(string token, string secret)
    {
        try
        {
            var payload = JwtBuilder.Create()
                .WithAlgorithm(new HMACSHA512Algorithm())
                .WithSecret(secret)
                .MustVerifySignature()
                .Decode<Dictionary<string, object>>(token);

            if (payload.TryGetValue("sid", out var sid))
            {
                return (sid?.ToString(), null);
            }

            return (null, "Token does not contain 'sid' claim");
        }
        catch (Exception ex)
        {
            return (null, ex.Message);
        }
    }

    private static bool ShouldSkipValidation(string path)
    {
        if (ExcludedPaths.Contains(path))
            return true;

        if (path.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase))
            return true;

        if (path.StartsWith("/scalar", StringComparison.OrdinalIgnoreCase))
            return true;

        if (path.StartsWith("/openapi", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private static async Task WriteUnauthorizedResponse(HttpContext context, string code, string message)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";

        var response = new
        {
            error = new
            {
                code,
                message
            }
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}

public static class SessionValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseSessionValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SessionValidationMiddleware>();
    }

    public static UserSession? GetUserSession(this HttpContext context)
    {
        return context.Items.TryGetValue("UserSession", out var session) ? session as UserSession : null;
    }

    public static string? GetSessionId(this HttpContext context)
    {
        return context.Items.TryGetValue("SessionId", out var id) ? id?.ToString() : null;
    }
}

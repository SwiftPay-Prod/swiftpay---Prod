using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Middlewares;

public partial class AcquirerWebhookAuthMiddleware(RequestDelegate next)
{
    private static readonly Regex AcquirerRoutePattern = AcquirerRouteRegex();
    
    // Paths internos que NÃO são webhooks de adquirentes (validados por InternalApiKeyPreProcessor via Group)
    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "cashouts",
        "transactions",
        "orders"
    };

    public async Task InvokeAsync(HttpContext context, PrimaryDbContext dbContext)
    {
        var path = context.Request.Path.Value ?? "";

        var match = AcquirerRoutePattern.Match(path);
        if (!match.Success)
        {
            await next(context);
            return;
        }

        var acquirerCode = match.Groups[1].Value.ToLowerInvariant();
        
        // Verifica se é um path excluído (não é webhook de adquirente)
        if (ExcludedPaths.Contains(acquirerCode))
        {
            await next(context);
            return;
        }

        var acquirer = await dbContext.Acquirers
            .AsNoTracking()
            .Where(a => a.Code.ToLower() == acquirerCode && a.IsActive)
            .OrderBy(a => a.Id)
            .FirstOrDefaultAsync(context.RequestAborted);

        if (acquirer == null)
        {
            await WriteUnauthorizedResponse(context, "Adquirente não encontrada.");
            return;
        }

        var isAuthenticated = acquirer.WebhookAuthMode switch
        {
            WebhookAuthMode.Token => ValidateToken(context, acquirer),
            WebhookAuthMode.Ip => ValidateIp(context, acquirer),
            WebhookAuthMode.TokenAndIp => ValidateToken(context, acquirer) && ValidateIp(context, acquirer),
            WebhookAuthMode.HmacSha256 => await ValidateHmacSignatureAsync(context, acquirer),
            _ => false
        };

        if (!isAuthenticated)
        {
            await WriteUnauthorizedResponse(context, "Não autorizado.");
            return;
        }

        context.Items["Acquirer"] = acquirer;

        await next(context);
    }

    private static bool ValidateToken(HttpContext context, Acquirer acquirer)
    {
        if (string.IsNullOrEmpty(acquirer.WebhookToken))
        {
            return false;
        }

        if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            var authValue = authHeader.ToString();
            if (authValue.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = authValue["Bearer ".Length..].Trim();
                if (SecureCompare(token, acquirer.WebhookToken))
                    return true;
            }
        }

        if (context.Request.Headers.TryGetValue("X-Webhook-Token", out var tokenHeader))
        {
            if (SecureCompare(tokenHeader.ToString(), acquirer.WebhookToken))
                return true;
        }

        if (context.Request.Headers.TryGetValue("X-Webhook-Secret", out var secretHeader))
        {
            if (SecureCompare(secretHeader.ToString(), acquirer.WebhookToken))
                return true;
        }

        if (context.Request.Headers.TryGetValue("X-Api-Key", out var apiKeyHeader))
        {
            if (SecureCompare(apiKeyHeader.ToString(), acquirer.WebhookToken))
                return true;
        }

        if (context.Request.Query.TryGetValue("token", out var queryToken))
        {
            if (SecureCompare(queryToken.ToString(), acquirer.WebhookToken))
                return true;
        }

        return false;
    }

    private static bool ValidateIp(HttpContext context, Acquirer acquirer)
    {
        if (string.IsNullOrEmpty(acquirer.WebhookAllowedIps))
        {
            return false;
        }

        var clientIp = PaymentEndpointUtils.GetIpAddress(context);
        return IsIpAllowed(clientIp, acquirer.WebhookAllowedIps);
    }

    private static bool IsIpAllowed(string clientIp, string allowedIps)
    {
        if (string.IsNullOrEmpty(clientIp) || clientIp == "unknown")
            return false;

        var allowedList = allowedIps.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var allowed in allowedList)
        {
            if (allowed == "*")
                return true;

            if (allowed.Contains('/'))
            {
                if (IsIpInCidrRange(clientIp, allowed))
                    return true;
            }
            else
            {
                if (string.Equals(clientIp, allowed, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
        }

        return false;
    }

    private static bool IsIpInCidrRange(string clientIp, string cidr)
    {
        try
        {
            var parts = cidr.Split('/');
            if (parts.Length != 2)
                return false;

            if (!IPAddress.TryParse(parts[0], out var networkAddress))
                return false;

            if (!int.TryParse(parts[1], out var prefixLength))
                return false;

            if (!IPAddress.TryParse(clientIp, out var clientAddress))
                return false;

            if (networkAddress.AddressFamily != clientAddress.AddressFamily)
                return false;

            var networkBytes = networkAddress.GetAddressBytes();
            var clientBytes = clientAddress.GetAddressBytes();

            var fullBytes = prefixLength / 8;
            var remainingBits = prefixLength % 8;

            for (var i = 0; i < fullBytes; i++)
            {
                if (networkBytes[i] != clientBytes[i])
                    return false;
            }

            if (remainingBits > 0 && fullBytes < networkBytes.Length)
            {
                var mask = (byte)(0xFF << (8 - remainingBits));
                if ((networkBytes[fullBytes] & mask) != (clientBytes[fullBytes] & mask))
                    return false;
            }

            return true;
        }
        catch
        {
            return false;
        }
    }

    private static bool SecureCompare(string a, string b)
    {
        if (a.Length != b.Length)
            return false;

        var aBytes = Encoding.UTF8.GetBytes(a);
        var bBytes = Encoding.UTF8.GetBytes(b);

        return CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }

    private static async Task<bool> ValidateHmacSignatureAsync(HttpContext context, Acquirer acquirer)
    {
        if (string.IsNullOrEmpty(acquirer.WebhookToken))
        {
            return false;
        }

        if (string.Equals(acquirer.Code, "heartpay", StringComparison.OrdinalIgnoreCase))
        {
            return await ValidateHeartPayHmacSignatureAsync(context, acquirer.WebhookToken);
        }

        if (string.Equals(acquirer.Code, "magicpay", StringComparison.OrdinalIgnoreCase))
        {
            return await ValidateMagicPayHmacSignatureAsync(context, acquirer.WebhookToken);
        }

        if (!context.Request.Headers.TryGetValue("X-Webhook-Signature", out var signatureHeader))
        {
            return false;
        }

        context.Request.EnableBuffering();

        string body;
        using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
        }

        var expectedSignature = ComputeHmacSha256Hex(body, acquirer.WebhookToken);
        return SecureCompare(signatureHeader.ToString(), expectedSignature);
    }

    private static async Task<bool> ValidateHeartPayHmacSignatureAsync(HttpContext context, string webhookToken)
    {
        if (!context.Request.Headers.TryGetValue("X-HeartPay-Signature", out var signatureHeader))
        {
            return false;
        }

        if (!context.Request.Headers.TryGetValue("X-HeartPay-Timestamp", out var timestampHeader))
        {
            return false;
        }

        var signature = signatureHeader.ToString().Trim();
        var timestamp = timestampHeader.ToString().Trim();
        if (string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(timestamp))
        {
            return false;
        }

        context.Request.EnableBuffering();

        string body;
        using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
        }

        if (signature.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
        {
            signature = signature[7..];
        }

        var expectedSignature = ComputeHmacSha256Hex($"{timestamp}.{body}", webhookToken);
        return SecureCompare(signature.ToLowerInvariant(), expectedSignature);
    }

    private static async Task<bool> ValidateMagicPayHmacSignatureAsync(HttpContext context, string webhookToken)
    {
        if (!context.Request.Headers.TryGetValue("X-Signature", out var signatureHeader))
        {
            return false;
        }

        var signature = signatureHeader.ToString().Trim();
        if (string.IsNullOrWhiteSpace(signature))
        {
            return false;
        }

        context.Request.EnableBuffering();

        string body;
        using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
        {
            body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;
        }

        var expectedSignature = ComputeHmacSha256Hex(body, webhookToken);
        return SecureCompare(signature.ToLowerInvariant(), expectedSignature);
    }

    private static string ComputeHmacSha256Hex(string payload, string secret)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static async Task WriteUnauthorizedResponse(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";

        var response = new BaseResponse
        {
            Error = new ApiErrorResponse(message, "unauthorized")
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }

    [GeneratedRegex(@"^/v1/internal/([^/]+)/", RegexOptions.IgnoreCase | RegexOptions.Compiled)]
    private static partial Regex AcquirerRouteRegex();
}

public static class AcquirerWebhookAuthMiddlewareExtensions
{
    public static IApplicationBuilder UseAcquirerWebhookAuth(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<AcquirerWebhookAuthMiddleware>();
    }
}

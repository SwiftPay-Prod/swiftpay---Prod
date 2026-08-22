using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_payment.Clients.PixHub;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Filters;

public class AcquirerWebhookAuthPreProcessor : IGlobalPreProcessor
{
    private const int MaxLoggedBodyLength = 200_000;

    public async Task PreProcessAsync(IPreProcessorContext ctx, CancellationToken ct)
    {
        var acquirerCode = GetAcquirerCodeFromRoute(ctx.HttpContext);
        if (string.IsNullOrEmpty(acquirerCode))
        {
            if (!ctx.HttpContext.ResponseStarted())
            {
                await ctx.HttpContext.Response.SendAsync(new BaseResponse
                {
                    Error = new ApiErrorResponse("Código da adquirente não identificado.", "unauthorized")
                }, StatusCodes.Status401Unauthorized, cancellation: ct);
            }
            return;
        }

        var dbContext = ctx.HttpContext.Resolve<PrimaryDbContext>();
        var normalizedAcquirerCode = acquirerCode.Trim().ToLowerInvariant();
        var acquirerCodePrefix = $"{normalizedAcquirerCode}_";

        var acquirerCandidates = await dbContext.Acquirers
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(a => a.IsActive
                && a.Code != null
                && (a.Code.ToLower() == normalizedAcquirerCode || a.Code.ToLower().StartsWith(acquirerCodePrefix)))
            .OrderBy(a => a.Id)
            .ToListAsync(ct);

        if (acquirerCandidates.Count == 0)
        {
            if (!ctx.HttpContext.ResponseStarted())
            {
                await ctx.HttpContext.Response.SendAsync(new BaseResponse
                {
                    Error = new ApiErrorResponse("Adquirente não encontrada.", "unauthorized")
                }, StatusCodes.Status401Unauthorized, cancellation: ct);
            }
            return;
        }

        Acquirer? acquirer = null;
        foreach (var candidate in acquirerCandidates)
        {
            if (!await IsAuthenticatedAsync(ctx.HttpContext, candidate))
                continue;

            acquirer = candidate;
            break;
        }

        if (acquirer == null)
        {
            if (!ctx.HttpContext.ResponseStarted())
            {
                await ctx.HttpContext.Response.SendAsync(new BaseResponse
                {
                    Error = new ApiErrorResponse("Não autorizado.", "unauthorized")
                }, StatusCodes.Status401Unauthorized, cancellation: ct);
            }
            return;
        }

        ctx.HttpContext.Items["Acquirer"] = acquirer;

        if (IsRealWebhookPath(ctx.HttpContext.Request.Path.Value))
        {
            await LogWebhookRequestAsync(ctx.HttpContext, acquirer, ct);
        }
    }

    private static async Task<bool> IsAuthenticatedAsync(HttpContext context, Acquirer acquirer)
    {
        return acquirer.WebhookAuthMode switch
        {
            WebhookAuthMode.None => true,
            WebhookAuthMode.Token => ValidateToken(context, acquirer),
            WebhookAuthMode.Ip => ValidateIp(context, acquirer),
            WebhookAuthMode.TokenAndIp => ValidateToken(context, acquirer) && ValidateIp(context, acquirer),
            WebhookAuthMode.HmacSha256 => await ValidateHmacSignatureAsync(context, acquirer),
            _ => false
        };
    }

    private static bool IsRealWebhookPath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return false;

        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.Length == 4
            && segments[0].Equals("v1", StringComparison.OrdinalIgnoreCase)
            && segments[1].Equals("internal", StringComparison.OrdinalIgnoreCase)
            && segments[3].Equals("webhooks", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task LogWebhookRequestAsync(HttpContext httpContext, Acquirer acquirer, CancellationToken ct)
    {
        var logService = httpContext.Resolve<IAcquirerWebhookLogService>();

        var requestBody = await ReadRequestBodyAsync(httpContext);
        var headers = SerializeHeaders(httpContext);

        await logService.LogAsync(new AcquirerWebhookLogInput
        {
            AcquirerId = acquirer.Id,
            AcquirerType = acquirer.Type.ToString(),
            AcquirerCode = acquirer.Code,
            HttpMethod = httpContext.Request.Method,
            Endpoint = httpContext.Request.Path.Value ?? "/unknown",
            QueryString = httpContext.Request.QueryString.HasValue ? httpContext.Request.QueryString.Value : null,
            RequestHeaders = headers,
            RequestBody = requestBody,
            IpAddress = GetClientIp(httpContext),
            UserAgent = httpContext.Request.Headers.UserAgent.ToString(),
            Location = ResolveLocation(httpContext),
            CorrelationId = httpContext.Request.Headers["X-Correlation-Id"].ToString(),
            ContentType = httpContext.Request.ContentType,
            ContentLength = httpContext.Request.ContentLength
        });
    }

    private static async Task<string?> ReadRequestBodyAsync(HttpContext context)
    {
        if (context.Request.Body is null || !context.Request.Body.CanSeek)
            return null;

        context.Request.Body.Position = 0;
        using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
        var body = await reader.ReadToEndAsync();
        context.Request.Body.Position = 0;

        if (string.IsNullOrWhiteSpace(body))
            return null;

        if (body.Length <= MaxLoggedBodyLength)
            return body;

        return body[..MaxLoggedBodyLength];
    }

    private static string? SerializeHeaders(HttpContext context)
    {
        if (context.Request.Headers.Count == 0)
            return null;

        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var header in context.Request.Headers)
        {
            var value = header.Value.ToString();
            if (string.IsNullOrWhiteSpace(value))
                continue;

            headers[header.Key] = IsSensitiveHeader(header.Key) ? "***" : value;
        }

        if (headers.Count == 0)
            return null;

        return JsonSerializer.Serialize(headers);
    }

    private static bool IsSensitiveHeader(string headerName)
    {
        return headerName.Equals("Authorization", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-Webhook-Token", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-Webhook-Secret", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-Api-Key", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-Webhook-Code", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-Webhook-Signature", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-HeartPay-Signature", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("X-Signature", StringComparison.OrdinalIgnoreCase)
            || headerName.Equals("PixHub-Signature", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ResolveLocation(HttpContext context)
    {
        var city = GetHeader(context, "CF-IPCity")
            ?? GetHeader(context, "X-Appengine-City")
            ?? GetHeader(context, "X-Geo-City")
            ?? GetHeader(context, "X-City");

        var region = GetHeader(context, "CF-IPRegion")
            ?? GetHeader(context, "X-Appengine-Region")
            ?? GetHeader(context, "X-Geo-Region")
            ?? GetHeader(context, "X-Region");

        var country = GetHeader(context, "CF-IPCountry")
            ?? GetHeader(context, "X-Country-Code")
            ?? GetHeader(context, "X-Vercel-IP-Country")
            ?? GetHeader(context, "X-Appengine-Country");

        var parts = new[] { city, region, country }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (parts.Length == 0)
            return null;

        return string.Join(", ", parts);
    }

    private static string? GetHeader(HttpContext context, string name)
    {
        if (!context.Request.Headers.TryGetValue(name, out var value))
            return null;

        var normalized = value.ToString().Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string? GetAcquirerCodeFromRoute(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length >= 3 &&
            segments[0].Equals("v1", StringComparison.OrdinalIgnoreCase) &&
            segments[1].Equals("internal", StringComparison.OrdinalIgnoreCase))
        {
            return segments[2];
        }

        return null;
    }

    private static bool ValidateToken(HttpContext context, Acquirer acquirer)
    {
        if (string.IsNullOrEmpty(acquirer.WebhookToken))
            return false;

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

        if (context.Request.Headers.TryGetValue("X-Webhook-Code", out var webhookCodeHeader))
        {
            if (SecureCompare(webhookCodeHeader.ToString(), acquirer.WebhookToken))
                return true;
        }

        return false;
    }

    private static bool ValidateIp(HttpContext context, Acquirer acquirer)
    {
        if (string.IsNullOrEmpty(acquirer.WebhookAllowedIps))
            return false;

        var clientIp = GetClientIp(context);
        if (string.IsNullOrEmpty(clientIp))
            return false;

        var allowedIps = acquirer.WebhookAllowedIps
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        return allowedIps.Contains(clientIp);
    }

    private static async Task<bool> ValidateHmacSignatureAsync(HttpContext context, Acquirer acquirer)
    {
        if (string.IsNullOrEmpty(acquirer.WebhookToken))
            return false;

        if (context.RequestAborted.IsCancellationRequested)
            return false;

        if (IsAcquirerCodeFamily(acquirer.Code, "heartpay"))
        {
            return await ValidateHeartPaySignatureAsync(context, acquirer.WebhookToken);
        }

        if (IsAcquirerCodeFamily(acquirer.Code, "magicpay"))
        {
            return await ValidateMagicPaySignatureAsync(context, acquirer.WebhookToken);
        }

        if (IsAcquirerCodeFamily(acquirer.Code, "pixhub"))
        {
            return await ValidatePixHubSignatureAsync(context, acquirer.WebhookToken);
        }

        if (!context.Request.Headers.TryGetValue("X-Webhook-Signature", out var signatureHeader))
            return false;

        var providedSignature = signatureHeader.ToString();
        if (string.IsNullOrWhiteSpace(providedSignature))
            return false;

        context.Request.Body.Position = 0;
        using var bodyStream = new MemoryStream();
        try
        {
            await context.Request.Body.CopyToAsync(bodyStream, CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
        var bodyBytes = bodyStream.ToArray();
        context.Request.Body.Position = 0;

        var normalizedSignature = providedSignature.Trim();
        if (normalizedSignature.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[7..];
        else if (normalizedSignature.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[7..];
        else if (normalizedSignature.StartsWith("v1=", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[3..];

        var secretBytes = Encoding.UTF8.GetBytes(acquirer.WebhookToken);
        var expectedHex = ComputeHexSignature(bodyBytes, secretBytes);
        if (IsHexString(normalizedSignature) && SecureCompare(expectedHex, normalizedSignature.ToLowerInvariant()))
            return true;

        var expectedBase64 = ComputeBase64Signature(bodyBytes, secretBytes);
        var expectedBase64Url = expectedBase64.TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        if (SecureCompare(expectedBase64, normalizedSignature) || SecureCompare(expectedBase64Url, normalizedSignature))
            return true;

        var hexKeyBytes = TryGetHexKeyBytes(acquirer.WebhookToken);
        if (hexKeyBytes == null)
            return false;

        var expectedHexFromHex = ComputeHexSignature(bodyBytes, hexKeyBytes);
        if (IsHexString(normalizedSignature) && SecureCompare(expectedHexFromHex, normalizedSignature.ToLowerInvariant()))
            return true;

        var expectedBase64FromHex = ComputeBase64Signature(bodyBytes, hexKeyBytes);
        var expectedBase64UrlFromHex = expectedBase64FromHex.TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        return SecureCompare(expectedBase64FromHex, normalizedSignature)
            || SecureCompare(expectedBase64UrlFromHex, normalizedSignature);
    }

    private static async Task<bool> ValidatePixHubSignatureAsync(HttpContext context, string webhookToken)
    {
        if (!context.Request.Headers.TryGetValue("PixHub-Signature", out var signatureHeader))
            return false;

        context.Request.Body.Position = 0;
        using var bodyStream = new MemoryStream();
        try
        {
            await context.Request.Body.CopyToAsync(bodyStream, CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
        context.Request.Body.Position = 0;

        return PixHubWebhookSignatureVerifier.Verify(
            bodyStream.ToArray(),
            signatureHeader.ToString(),
            webhookToken,
            DateTimeOffset.UtcNow);
    }

    private static async Task<bool> ValidateHeartPaySignatureAsync(HttpContext context, string webhookToken)
    {
        if (!context.Request.Headers.TryGetValue("X-HeartPay-Signature", out var signatureHeader))
            return false;

        if (!context.Request.Headers.TryGetValue("X-HeartPay-Timestamp", out var timestampHeader))
            return false;

        var providedSignature = signatureHeader.ToString().Trim();
        var timestamp = timestampHeader.ToString().Trim();
        if (string.IsNullOrWhiteSpace(providedSignature) || string.IsNullOrWhiteSpace(timestamp))
            return false;

        context.Request.Body.Position = 0;
        using var bodyStream = new MemoryStream();
        try
        {
            await context.Request.Body.CopyToAsync(bodyStream, CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            return false;
        }

        var bodyBytes = bodyStream.ToArray();
        context.Request.Body.Position = 0;

        var payloadBytes = Encoding.UTF8.GetBytes($"{timestamp}.{Encoding.UTF8.GetString(bodyBytes)}");

        var normalizedSignature = providedSignature;
        if (normalizedSignature.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[7..];
        else if (normalizedSignature.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[7..];

        var tokenBytes = Encoding.UTF8.GetBytes(webhookToken);
        var expectedHex = ComputeHexSignature(payloadBytes, tokenBytes);
        if (IsHexString(normalizedSignature) && SecureCompare(expectedHex, normalizedSignature.ToLowerInvariant()))
            return true;

        var expectedBase64 = ComputeBase64Signature(payloadBytes, tokenBytes);
        if (SecureCompare(expectedBase64, normalizedSignature))
            return true;

        var hexKeyBytes = TryGetHexKeyBytes(webhookToken);
        if (hexKeyBytes == null)
            return false;

        var expectedHexFromHex = ComputeHexSignature(payloadBytes, hexKeyBytes);
        if (IsHexString(normalizedSignature) && SecureCompare(expectedHexFromHex, normalizedSignature.ToLowerInvariant()))
            return true;

        var expectedBase64FromHex = ComputeBase64Signature(payloadBytes, hexKeyBytes);
        return SecureCompare(expectedBase64FromHex, normalizedSignature);
    }

    private static async Task<bool> ValidateMagicPaySignatureAsync(HttpContext context, string webhookToken)
    {
        if (!context.Request.Headers.TryGetValue("X-Signature", out var signatureHeader))
            return false;

        var providedSignature = signatureHeader.ToString().Trim();
        if (string.IsNullOrWhiteSpace(providedSignature))
            return false;

        context.Request.Body.Position = 0;
        using var bodyStream = new MemoryStream();
        try
        {
            await context.Request.Body.CopyToAsync(bodyStream, CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            return false;
        }

        var bodyBytes = bodyStream.ToArray();
        context.Request.Body.Position = 0;

        var normalizedSignature = providedSignature;
        if (normalizedSignature.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[7..];
        else if (normalizedSignature.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase))
            normalizedSignature = normalizedSignature[7..];

        var tokenBytes = Encoding.UTF8.GetBytes(webhookToken);
        var expectedHex = ComputeHexSignature(bodyBytes, tokenBytes);
        if (IsHexString(normalizedSignature) && SecureCompare(expectedHex, normalizedSignature.ToLowerInvariant()))
            return true;

        var expectedBase64 = ComputeBase64Signature(bodyBytes, tokenBytes);
        if (SecureCompare(expectedBase64, normalizedSignature))
            return true;

        var hexKeyBytes = TryGetHexKeyBytes(webhookToken);
        if (hexKeyBytes == null)
            return false;

        var expectedHexFromHex = ComputeHexSignature(bodyBytes, hexKeyBytes);
        if (IsHexString(normalizedSignature) && SecureCompare(expectedHexFromHex, normalizedSignature.ToLowerInvariant()))
            return true;

        var expectedBase64FromHex = ComputeBase64Signature(bodyBytes, hexKeyBytes);
        return SecureCompare(expectedBase64FromHex, normalizedSignature);
    }

    private static string? GetClientIp(HttpContext context)
    {
        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
        {
            return forwardedFor.Split(',')[0].Trim();
        }

        return context.Connection.RemoteIpAddress?.ToString();
    }

    private static bool SecureCompare(string a, string b)
    {
        if (a.Length != b.Length)
            return false;

        var result = 0;
        for (var i = 0; i < a.Length; i++)
        {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }

    private static bool IsHexString(string value)
    {
        for (var i = 0; i < value.Length; i++)
        {
            var c = value[i];
            var isDigit = c is >= '0' and <= '9';
            var isLower = c is >= 'a' and <= 'f';
            var isUpper = c is >= 'A' and <= 'F';
            if (!isDigit && !isLower && !isUpper)
                return false;
        }

        return value.Length > 0;
    }

    private static string ComputeHexSignature(byte[] bodyBytes, byte[] keyBytes)
    {
        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(bodyBytes);
        return Convert.ToHexStringLower(hashBytes);
    }

    private static string ComputeBase64Signature(byte[] bodyBytes, byte[] keyBytes)
    {
        using var hmac = new HMACSHA256(keyBytes);
        var hashBytes = hmac.ComputeHash(bodyBytes);
        return Convert.ToBase64String(hashBytes);
    }

    private static byte[]? TryGetHexKeyBytes(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        if (token.Length % 2 != 0 || !IsHexString(token))
            return null;

        return Convert.FromHexString(token);
    }

    private static bool IsAcquirerCodeFamily(string? code, string baseCode)
    {
        if (string.IsNullOrWhiteSpace(code))
            return false;

        var normalizedCode = code.Trim();
        return normalizedCode.Equals(baseCode, StringComparison.OrdinalIgnoreCase)
            || normalizedCode.StartsWith($"{baseCode}_", StringComparison.OrdinalIgnoreCase);
    }
}

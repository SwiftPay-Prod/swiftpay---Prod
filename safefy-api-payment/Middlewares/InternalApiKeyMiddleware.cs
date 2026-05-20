using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_payment.Endpoints.Models;
using safefy_api_core.Constants;

namespace safefy_api_payment.Middlewares;

public partial class InternalApiKeyMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private const string InternalApiKeyHeader = "X-Internal-Api-Key";
    
    [GeneratedRegex(@"^/v1/internal/([^/]+)/", RegexOptions.IgnoreCase)]
    private static partial Regex AcquirerCodeRegex();

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        if (!path.StartsWith("/v1/internal/", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (await IsAcquirerWebhookRoute(context, path))
        {
            await next(context);
            return;
        }

        var internalApiKey = configuration["PlatformSettings:InternalApiKey"];

        if (string.IsNullOrEmpty(internalApiKey))
        {
            await WriteUnauthorizedResponse(context, "Configuração de API interna ausente.", PaymentApiErrorCodes.InternalApiKeyMissing);
            return;
        }

        if (!context.Request.Headers.TryGetValue(InternalApiKeyHeader, out var providedKey))
        {
            await WriteUnauthorizedResponse(context, "Header de autenticação interna ausente.", PaymentApiErrorCodes.InternalApiKeyMissing);
            return;
        }

        if (!string.Equals(internalApiKey, providedKey.ToString(), StringComparison.Ordinal))
        {
            await WriteUnauthorizedResponse(context, "Chave de API interna inválida.", PaymentApiErrorCodes.InternalApiKeyInvalid);
            return;
        }

        await next(context);
    }
    
    private static async Task<bool> IsAcquirerWebhookRoute(HttpContext context, string path)
    {
        var match = AcquirerCodeRegex().Match(path);
        
        if (!match.Success)
            return false;
        
        var acquirerCode = match.Groups[1].Value.ToLowerInvariant();
        
        var dbContext = context.RequestServices.GetRequiredService<PrimaryDbContext>();
        
        var isValidAcquirer = await dbContext.Acquirers
            .AsNoTracking()
            .IgnoreQueryFilters()
            .AnyAsync(a => a.Code.ToLower() == acquirerCode && a.IsActive);
        
        return isValidAcquirer;
    }

    private static async Task WriteUnauthorizedResponse(HttpContext context, string message, string code)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        context.Response.ContentType = "application/json";

        var response = new BaseResponse
        {
            Error = new ApiErrorResponse(message, code)
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}

public static class InternalApiKeyMiddlewareExtensions
{
    public static IApplicationBuilder UseInternalApiKey(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<InternalApiKeyMiddleware>();
    }
}

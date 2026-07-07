using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Services;

namespace swiftpay_api_payment.Middlewares;

public class CredentialValidationMiddleware(RequestDelegate next)
{
    private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/v1/auth/token",
        "/health",
        "/docs",
        "/openapi"
    };

    public async Task InvokeAsync(HttpContext context, PrimaryDbContext dbContext)
    {
        var path = context.Request.Path.Value ?? "";

        if (ShouldSkipValidation(path))
        {
            await next(context);
            return;
        }

        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var credentialId = PaymentEndpointUtils.GetCredentialId(context.User);
        if (credentialId == null)
        {
            await next(context);
            return;
        }

        var tokenSecretVersion = PaymentEndpointUtils.GetSecretVersion(context.User);
        var tokenEnvironment = PaymentEndpointUtils.GetEnvironment(context.User);

        if (!tokenEnvironment.HasValue)
        {
            await WriteUnauthorizedResponse(context, "Token inválido. Ambiente não encontrado.", PaymentApiErrorCodes.InvalidCredentials);
            return;
        }

        using (HybridEnvironmentProvider.SetEnvironment(tokenEnvironment.Value))
        {
            await ValidateCredentialAndContinueAsync(context, dbContext, credentialId.Value, tokenSecretVersion);
        }
    }

    private async Task ValidateCredentialAndContinueAsync(
        HttpContext context,
        PrimaryDbContext dbContext,
        Guid credentialId,
        int tokenSecretVersion)
    {

        var credential = await dbContext.MerchantApiCredentials
            .AsNoTracking()
            .Where(c => c.Id == credentialId)
            .OrderBy(c => c.Id)
            .Select(c => new
            {
                c.Status,
                c.SecretVersion,
                MerchantStatus = c.Merchant.Status
            })
            .FirstOrDefaultAsync(context.RequestAborted);

        if (credential == null)
        {
            await WriteUnauthorizedResponse(context, "Credencial não encontrada.", PaymentApiErrorCodes.CredentialNotFound);
            return;
        }

        if (credential.Status != MerchantApiCredentialStatus.Active)
        {
            await WriteUnauthorizedResponse(context, "Credencial inativa ou revogada.", PaymentApiErrorCodes.CredentialInactive);
            return;
        }

        if (credential.SecretVersion != tokenSecretVersion)
        {
            await WriteUnauthorizedResponse(context, "Token inválido. As credenciais foram regeneradas.", PaymentApiErrorCodes.CredentialInactive);
            return;
        }

        if (credential.MerchantStatus != MerchantStatus.Active)
        {
            await WriteUnauthorizedResponse(context, "Sua conta está inativa. Entre em contato com o suporte.", PaymentApiErrorCodes.MerchantInactive);
            return;
        }

        await next(context);
    }

    private static bool ShouldSkipValidation(string path)
    {
        if (path.StartsWith("/v1/internal/", StringComparison.OrdinalIgnoreCase))
            return true;

        foreach (var excludedPath in ExcludedPaths)
        {
            if (path.StartsWith(excludedPath, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
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

public static class CredentialValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseCredentialValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<CredentialValidationMiddleware>();
    }
}

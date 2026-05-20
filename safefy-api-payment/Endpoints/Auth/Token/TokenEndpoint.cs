using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using safefy_api_core.Database;
using safefy_api_payment.Documentation;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Utils;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces.Internal;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Constants;
using safefy_api_core.Models.Settings;

namespace safefy_api_payment.Endpoints.Auth.Token;

public sealed class TokenEndpoint(
    PrimaryDbContext dbContext,
    IOptions<JWTSettingsOptions> jwtSettings,
    ITokenService tokenService,
    IApiLogService apiLogService,
    IRateLimitService rateLimitService
) : Endpoint<TokenRequest, TokenResponse>
{
    public override void Configure()
    {
        Post("token");
        Group<AuthGroup>();
        AllowAnonymous();
        Description(d => d
            .WithName("ObterToken")
            .WithSummary("Autenticação OAuth2 - Client Credentials")
            .WithDescription(EndpointDescriptions.Auth.Token)
            .Produces<TokenResponse>(200, "application/json")
            .Produces<BaseResponse>(400, "application/json")
            .Produces<BaseResponse>(401, "application/json")
            .Produces<BaseResponse>(429, "application/json"));
    }

    public override async Task HandleAsync(TokenRequest req, CancellationToken ct)
    {
        var apiCredential = await dbContext.MerchantApiCredentials
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Where(mac => mac.ClientId == req.PublicKey)
            .OrderBy(mac => mac.Id)
            .Select(mac => new
            {
                mac.Id,
                mac.MerchantId,
                mac.ClientSecretHash,
                mac.Environment,
                mac.Status,
                mac.SecretVersion,
                mac.AllowedIpRange,
                MerchantStatus = dbContext.Merchants
                    .Where(m => m.Id == mac.MerchantId)
                    .Select(m => m.Status)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(ct);

        if (apiCredential == null)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.Authenticate,
                Status = ApiLogStatus.Failed,
                StatusCode = 401,
                Details = "Credencial não encontrada"
            });
            await Send.ResponseAsync(new TokenResponse
            {
                Error = new ApiErrorResponse("Credenciais inválidas.", PaymentApiErrorCodes.InvalidCredentials)
            }, 401, cancellation: ct);
            return;
        }

        // Validate status
        if (apiCredential.Status != MerchantApiCredentialStatus.Active)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.Authenticate,
                Status = ApiLogStatus.Failed,
                ResourceId = apiCredential.Id,
                ResourceType = ApiLogResourceType.Credential,
                StatusCode = 401,
                Details = "Credencial inativa ou revogada"
            });
            await Send.ResponseAsync(new TokenResponse
            {
                Error = new ApiErrorResponse("Credencial inativa ou revogada.", PaymentApiErrorCodes.CredentialInactive)
            }, 401, cancellation: ct);
            return;
        }

        if (apiCredential.MerchantStatus != MerchantStatus.Active)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.Authenticate,
                Status = ApiLogStatus.Failed,
                ResourceId = apiCredential.Id,
                ResourceType = ApiLogResourceType.Credential,
                StatusCode = 401,
                Details = "Merchant inativo"
            });
            await Send.ResponseAsync(new TokenResponse
            {
                Error = new ApiErrorResponse("Sua conta está inativa. Entre em contato com o suporte.", PaymentApiErrorCodes.MerchantInactive)
            }, 401, cancellation: ct);
            return;
        }

        // Check auth rate limit (10 tokens per hour per credential)
        var authRateLimit = rateLimitService.CheckAuthRateLimit(apiCredential.Id);
        if (!authRateLimit.IsAllowed)
        {
            HttpContext.Response.Headers["Retry-After"] = authRateLimit.RetryAfterSeconds.ToString();
            HttpContext.Response.Headers["X-RateLimit-Limit"] = authRateLimit.Limit.ToString();
            HttpContext.Response.Headers["X-RateLimit-Remaining"] = "0";

            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.Authenticate,
                Status = ApiLogStatus.Failed,
                ResourceId = apiCredential.Id,
                ResourceType = ApiLogResourceType.Credential,
                StatusCode = 429,
                Details = $"Rate limit excedido: {authRateLimit.CurrentCount}/{authRateLimit.Limit} tokens/hora"
            });

            await Send.ResponseAsync(new TokenResponse
            {
                Error = new ApiErrorResponse(
                    $"Limite de geração de tokens excedido ({authRateLimit.Limit}/hora). Aguarde {authRateLimit.RetryAfterSeconds / 60} minutos.",
                    PaymentApiErrorCodes.AuthRateLimitExceeded)
            }, 429, cancellation: ct);
            return;
        }

        // Validate secret
        var secretHash = CryptoUtils.ComputeSha256Hash(req.SecretKey);
        if (secretHash != apiCredential.ClientSecretHash)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.Authenticate,
                Status = ApiLogStatus.Failed,
                ResourceId = apiCredential.Id,
                ResourceType = ApiLogResourceType.Credential,
                StatusCode = 401,
                Details = "Secret Key inválido"
            });
            await Send.ResponseAsync(new TokenResponse
            {
                Error = new ApiErrorResponse("Credenciais inválidas.", PaymentApiErrorCodes.InvalidCredentials)
            }, 401, cancellation: ct);
            return;
        }

        // Validate IP if configured
        if (!string.IsNullOrEmpty(apiCredential.AllowedIpRange))
        {
            var clientIp = PaymentEndpointUtils.GetIpAddress(HttpContext);
            if (!IsIpAllowed(clientIp, apiCredential.AllowedIpRange))
            {
                await apiLogService.LogAsync(new ApiLogInput
                {
                    Action = ApiLogAction.Authenticate,
                    Status = ApiLogStatus.Failed,
                    ResourceId = apiCredential.Id,
                    ResourceType = ApiLogResourceType.Credential,
                    StatusCode = 403,
                    Details = $"IP não autorizado: {clientIp}"
                });
                await Send.ResponseAsync(new TokenResponse
                {
                    Error = new ApiErrorResponse("Acesso não autorizado a partir deste IP.", PaymentApiErrorCodes.IpNotAllowed)
                }, 403, cancellation: ct);
                return;
            }
        }

        // Generate token
        var accessToken = tokenService.GenerateAccessToken(
            apiCredential.MerchantId,
            apiCredential.Id,
            apiCredential.Environment.ToString(),
            apiCredential.SecretVersion
        );

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.Authenticate,
            Status = ApiLogStatus.Success,
            ResourceId = apiCredential.Id,
            ResourceType = ApiLogResourceType.Credential,
            StatusCode = 200,
            Details = $"Token gerado para ambiente {apiCredential.Environment}"
        });

        await Send.ResponseAsync(new TokenResponse
        {
            Data = new TokenData
            {
                AccessToken = accessToken,
                TokenType = "Bearer",
                ExpiresIn = jwtSettings.Value.TokenExpireSeconds,
                Environment = apiCredential.Environment.ToString()
            }
        }, 200, cancellation: ct);
    }

    private static bool IsIpAllowed(string clientIp, string allowedIpRange)
    {
        var allowedIps = allowedIpRange.Split(',', StringSplitOptions.RemoveEmptyEntries);
        return allowedIps.Any(ip => ip.Trim() == clientIp || ip.Trim() == "*");
    }
}

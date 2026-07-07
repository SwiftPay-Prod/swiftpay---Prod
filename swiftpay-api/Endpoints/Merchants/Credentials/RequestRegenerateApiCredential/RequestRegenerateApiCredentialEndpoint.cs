using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.Credentials.RequestRegenerateApiCredential;

public sealed class RequestRegenerateApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService
) : Endpoint<RequestRegenerateApiCredentialRequest, RequestRegenerateApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/{credentialId:guid}/request-regenerate");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RequestRegenerateApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestRegenerateApiCredentialResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new RequestRegenerateApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new RequestRegenerateApiCredentialResponse
            {
                Error = new("A organização precisa estar ativa para regenerar credenciais de API.")
            }, 400, ct);
            return;
        }

        var credential = await dbContext.MerchantApiCredentials
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CredentialId && c.MerchantId == req.MerchantId, ct);

        if (credential == null)
        {
            await Send.ResponseAsync(new RequestRegenerateApiCredentialResponse
            {
                Error = new("Credencial não encontrada.")
            }, 404, ct);
            return;
        }

        if (credential.Status != MerchantApiCredentialStatus.Active)
        {
            await Send.ResponseAsync(new RequestRegenerateApiCredentialResponse
            {
                Error = new("Somente credenciais ativas podem ter suas chaves regeneradas.")
            }, 400, ct);
            return;
        }

        var existingCodes = await dbContext.ApiCredentialCodes
            .Where(c => c.CredentialId == req.CredentialId &&
                        c.Action == ApiCredentialCodeAction.Regenerate &&
                        c.Status == ApiCredentialCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = ApiCredentialCodeStatus.ExpiredByNewCode;
        }

        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);

        var apiCredentialCode = new ApiCredentialCode
        {
            MerchantId = merchant.Id,
            UserId = userId.Value,
            CredentialId = credential.Id,
            CodeHash = codeHash,
            Action = ApiCredentialCodeAction.Regenerate,
            Status = ApiCredentialCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CredentialName = credential.Name,
            CredentialEnvironment = credential.Environment,
            CredentialAllowedIpRange = credential.AllowedIpRange,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.ApiCredentialCodes.Add(apiCredentialCode);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Warning,
            UserId = userId,
            Details = $"Código de regeneração de credencial solicitado para credential {credential.Id}"
        });

        await SendCodeEmailAsync(merchant.User, merchant, credential, code, ipAddress, location);

        await Send.OkAsync(new RequestRegenerateApiCredentialResponse
        {
            Message = "Código de confirmação enviado para seu e-mail. Verifique sua caixa de entrada."
        }, ct);
    }

    private async Task SendCodeEmailAsync(User user, Merchant merchant, MerchantApiCredential credential, string code, string ipAddress, string location)
    {
        try
        {
            var now = DateTime.UtcNow;
            var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

            await emailService.SendAsync(
                user.Email,
                "🔄 Regenerar Credencial de API - SwiftPay",
                EmailTemplate.ApiCredentialCode,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                    { "CREDENTIAL_NAME", credential.Name ?? $"Credencial {credential.Environment}" },
                    { "ENVIRONMENT", credential.Environment.ToString() },
                    { "CODE", code },
                    { "EXPIRES_IN", "10" },
                    { "TITLE", "Regenerar Credencial de API" },
                    { "TITLE_ICON", "🔄" },
                    { "TITLE_COLOR", "#f59e0b" },
                    { "DESCRIPTION", "Você solicitou a regeneração das chaves desta credencial de API. As chaves antigas deixarão de funcionar." },
                    { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                    { "TIME", brazilTime.ToString("HH:mm:ss") },
                    { "IP_ADDRESS", ipAddress },
                    { "LOCATION", location }
                },
                userId: user.Id,
                merchantId: merchant.Id
            );
        }
        catch
        {
            // Don't fail the request if email fails
        }
    }
}

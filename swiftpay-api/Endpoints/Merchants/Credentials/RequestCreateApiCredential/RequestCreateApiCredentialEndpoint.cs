using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.Credentials.RequestCreateApiCredential;

public sealed class RequestCreateApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService
) : Endpoint<RequestCreateApiCredentialRequest, RequestCreateApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/request-create");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RequestCreateApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RequestCreateApiCredentialResponse
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
            await Send.ResponseAsync(new RequestCreateApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new RequestCreateApiCredentialResponse
            {
                Error = new("A organização precisa estar ativa para criar credenciais de API.")
            }, 400, ct);
            return;
        }

        var existingCodes = await dbContext.ApiCredentialCodes
            .Where(c => c.MerchantId == req.MerchantId &&
                        c.UserId == userId &&
                        c.Action == ApiCredentialCodeAction.Create &&
                        c.Status == ApiCredentialCodeStatus.Pending)
            .ToListAsync(ct);

        foreach (var existingCode in existingCodes)
        {
            existingCode.Status = ApiCredentialCodeStatus.ExpiredByNewCode;
        }

        var code = CryptoUtils.GenerateCode();
        var codeHash = CryptoUtils.ComputeSha256Hash(code);
        var credentialName = req.Name ?? $"Credencial {req.Environment}";

        var apiCredentialCode = new ApiCredentialCode
        {
            MerchantId = merchant.Id,
            UserId = userId.Value,
            CredentialId = null,
            CodeHash = codeHash,
            Action = ApiCredentialCodeAction.Create,
            Status = ApiCredentialCodeStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddMinutes(10),
            CredentialName = credentialName,
            CredentialEnvironment = req.Environment,
            CredentialAllowedIpRange = req.AllowedIpRange,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.ApiCredentialCodes.Add(apiCredentialCode);
        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Warning,
            UserId = userId,
            Details = $"Código de criação de credencial solicitado para merchant {merchant.Id}"
        });

        await SendCodeEmailAsync(merchant.User, merchant, credentialName, req.Environment.ToString(), code, "Criar Credencial de API", "🔑", "#2563eb", "Você solicitou a criação de uma nova credencial de API.", ipAddress, location);

        await Send.OkAsync(new RequestCreateApiCredentialResponse
        {
            Message = "Código de confirmação enviado para seu e-mail. Verifique sua caixa de entrada."
        }, ct);
    }

    private async Task SendCodeEmailAsync(User user, Merchant merchant, string credentialName, string environment, string code, string title, string titleIcon, string titleColor, string description, string ipAddress, string location)
    {
        try
        {
            var now = DateTime.UtcNow;
            var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

            await emailService.SendAsync(
                user.Email,
                $"{titleIcon} {title} - Safefy",
                EmailTemplate.ApiCredentialCode,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
                    { "CREDENTIAL_NAME", credentialName },
                    { "ENVIRONMENT", environment },
                    { "CODE", code },
                    { "EXPIRES_IN", "10" },
                    { "TITLE", title },
                    { "TITLE_ICON", titleIcon },
                    { "TITLE_COLOR", titleColor },
                    { "DESCRIPTION", description },
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

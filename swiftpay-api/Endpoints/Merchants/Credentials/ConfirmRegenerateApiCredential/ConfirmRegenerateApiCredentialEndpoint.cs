using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.Credentials.ConfirmRegenerateApiCredential;

public sealed class ConfirmRegenerateApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService
) : Endpoint<ConfirmRegenerateApiCredentialRequest, ConfirmRegenerateApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/{credentialId:guid}/confirm-regenerate");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ConfirmRegenerateApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);
        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
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
            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
            {
                Error = new("Credencial não encontrada.")
            }, 404, ct);
            return;
        }

        if (credential.Status != MerchantApiCredentialStatus.Active)
        {
            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
            {
                Error = new("Somente credenciais ativas podem ter suas chaves regeneradas.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var apiCredentialCode = await dbContext.ApiCredentialCodes
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c =>
                c.CredentialId == req.CredentialId &&
                c.Action == ApiCredentialCodeAction.Regenerate &&
                c.CodeHash == codeHash &&
                c.Status == ApiCredentialCodeStatus.Pending, ct);

        if (apiCredentialCode == null)
        {
            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
            {
                Error = new("Código inválido ou expirado.")
            }, 400, ct);
            return;
        }

        if (apiCredentialCode.IsExpired)
        {
            apiCredentialCode.Status = ApiCredentialCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);

            await Send.ResponseAsync(new ConfirmRegenerateApiCredentialResponse
            {
                Error = new("Código expirado. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        apiCredentialCode.Status = ApiCredentialCodeStatus.Used;

        var (clientId, clientSecret, clientSecretHash) = CryptoUtils.GenerateApiCredentials(credential.Environment.ToString());

        credential.ClientId = clientId;
        credential.ClientSecretHash = clientSecretHash;
        credential.SecretVersion++;
        credential.UpdatedAt = DateTime.UtcNow;

        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == userId, ct);

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Chaves da credencial de API {credential.Id} regeneradas para o merchant {merchant.Id}"
        });

        _ = notificationService.CreateSecurityNotificationAsync(
            req.MerchantId,
            "Credencial de API regenerada",
            $"As chaves da credencial '{credential.Name ?? $"Credencial {credential.Environment}"}' foram regeneradas. As chaves antigas não funcionarão mais.",
            NotificationPriority.Urgent
        );

        if (user != null)
        {
            var now = DateTime.UtcNow;
            var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

            _ = emailService.SendAsync(
                user.Email,
                "🔄 Credencial de API regenerada - SwiftPay",
                EmailTemplate.ApiCredentialRegenerated,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "CREDENTIAL_NAME", credential.Name ?? $"Credencial {credential.Environment}" },
                    { "ENVIRONMENT", credential.Environment.ToString() },
                    { "MERCHANT_NAME", merchant.Name ?? "Merchant" },
                    { "DATE", brazilTime.ToString("dd/MM/yyyy") },
                    { "TIME", brazilTime.ToString("HH:mm:ss") },
                    { "IP_ADDRESS", ipAddress },
                    { "LOCATION", location }
                },
                userId: user.Id,
                merchantId: merchant.Id
            );
        }

        await Send.OkAsync(new ConfirmRegenerateApiCredentialResponse
        {
            Data = new ConfirmRegenerateApiCredentialData
            {
                Id = credential.Id,
                Name = credential.Name,
                ClientId = clientId,
                ClientSecret = clientSecret,
                Environment = credential.Environment,
                AllowedIpRange = credential.AllowedIpRange,
                CreatedAt = credential.CreatedAt,
                UpdatedAt = credential.UpdatedAt
            }
        }, ct);
    }
}

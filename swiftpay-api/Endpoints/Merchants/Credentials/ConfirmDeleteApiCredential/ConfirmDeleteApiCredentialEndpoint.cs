using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Email;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;
using safefy_api.Endpoints.Merchants.Credentials.DeleteApiCredential;

namespace safefy_api.Endpoints.Merchants.Credentials.ConfirmDeleteApiCredential;

public sealed class ConfirmDeleteApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService
) : Endpoint<ConfirmDeleteApiCredentialRequest, ConfirmDeleteApiCredentialResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/api-credentials/{credentialId:guid}/confirm-delete");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ConfirmDeleteApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ConfirmDeleteApiCredentialResponse
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
            await Send.ResponseAsync(new ConfirmDeleteApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var credential = await dbContext.MerchantApiCredentials
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CredentialId && c.MerchantId == req.MerchantId, ct);

        if (credential == null)
        {
            await Send.ResponseAsync(new ConfirmDeleteApiCredentialResponse
            {
                Error = new("Credencial não encontrada.")
            }, 404, ct);
            return;
        }

        if (credential.Status == MerchantApiCredentialStatus.Revoked)
        {
            await Send.ResponseAsync(new ConfirmDeleteApiCredentialResponse
            {
                Error = new("Esta credencial já foi revogada.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var apiCredentialCode = await dbContext.ApiCredentialCodes
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c =>
                c.CredentialId == req.CredentialId &&
                c.Action == ApiCredentialCodeAction.Delete &&
                c.CodeHash == codeHash &&
                c.Status == ApiCredentialCodeStatus.Pending, ct);

        if (apiCredentialCode == null)
        {
            await Send.ResponseAsync(new ConfirmDeleteApiCredentialResponse
            {
                Error = new("Código inválido ou expirado.")
            }, 400, ct);
            return;
        }

        if (apiCredentialCode.IsExpired)
        {
            apiCredentialCode.Status = ApiCredentialCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);

            await Send.ResponseAsync(new ConfirmDeleteApiCredentialResponse
            {
                Error = new("Código expirado. Solicite um novo código.")
            }, 400, ct);
            return;
        }

        apiCredentialCode.Status = ApiCredentialCodeStatus.Used;

        credential.Status = MerchantApiCredentialStatus.Revoked;
        credential.UpdatedAt = DateTime.UtcNow;

        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == userId, ct);

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantUpdated,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Credencial de API {credential.Id} revogada para o merchant {merchant.Id}"
        });

        _ = notificationService.CreateSecurityNotificationAsync(
            req.MerchantId,
            "Credencial de API revogada",
            $"A credencial '{credential.Name ?? $"Credencial {credential.Environment}"}' foi revogada e não pode mais ser usada.",
            NotificationPriority.High
        );

        if (user != null)
        {
            var now = DateTime.UtcNow;
            var brazilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, brazilTimeZone);

            _ = emailService.SendAsync(
                user.Email,
                "🔒 Credencial de API revogada - Safefy",
                EmailTemplate.ApiCredentialRevoked,
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

        await Send.OkAsync(new ConfirmDeleteApiCredentialResponse
        {
            Data = new DeleteApiCredentialData
            {
                Id = credential.Id,
                Message = "Credencial revogada com sucesso."
            }
        }, ct);
    }
}

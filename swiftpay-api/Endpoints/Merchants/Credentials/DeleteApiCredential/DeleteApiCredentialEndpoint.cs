using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.Credentials.DeleteApiCredential;

public sealed class DeleteApiCredentialEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    IGeoLocationService geoLocationService,
    IEmailService emailService,
    INotificationService notificationService
) : Endpoint<DeleteApiCredentialRequest, DeleteApiCredentialResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/api-credentials/{credentialId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteApiCredentialRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteApiCredentialResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var ipAddress = EndpointUtils.GetIpAddress(HttpContext);

        var geoLocation = await geoLocationService.GetLocationAsync(ipAddress);
        var location = geoLocation.DisplayLocation;

        // Verificar se o merchant pertence ao usuário
        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new DeleteApiCredentialResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        // Find credential
        var credential = await dbContext.MerchantApiCredentials
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CredentialId && c.MerchantId == req.MerchantId, ct);

        if (credential == null)
        {
            await Send.ResponseAsync(new DeleteApiCredentialResponse
            {
                Error = new("Credencial não encontrada.")
            }, 404, ct);
            return;
        }

        if (credential.Status == MerchantApiCredentialStatus.Revoked)
        {
            await Send.ResponseAsync(new DeleteApiCredentialResponse
            {
                Error = new("Esta credencial já foi revogada.")
            }, 400, ct);
            return;
        }

        // Revoke the credential instead of deleting
        credential.Status = MerchantApiCredentialStatus.Revoked;
        credential.UpdatedAt = DateTime.UtcNow;

        // Get user email for notification BEFORE saving (to avoid DbContext concurrency issues)
        var user = await dbContext.Users.OrderBy(u => u.Id).FirstOrDefaultAsync(u => u.Id == userId, ct);

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput { Action = SecurityLogAction.MerchantUpdated, Status = SecurityLogStatus.Success, UserId = userId, Details = $"Credencial de API {credential.Id} revogada para o merchant {merchant.Id}" });

        // Create notification (fire-and-forget)
        _ = notificationService.CreateSecurityNotificationAsync(
            req.MerchantId,
            "Credencial de API revogada",
            $"A credencial '{credential.Name ?? $"Credencial {credential.Environment}"}' foi revogada e não pode mais ser usada.",
            NotificationPriority.High
        );

        // Send email notification (fire-and-forget)
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

        await Send.OkAsync(new DeleteApiCredentialResponse
        {
            Data = new DeleteApiCredentialData
            {
                Id = credential.Id,
                Message = "Credencial revogada com sucesso."
            }
        }, ct);
    }
}

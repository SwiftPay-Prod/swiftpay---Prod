using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Merchants.ConfirmDelete;

public sealed class ConfirmDeleteMerchantEndpoint(
    PrimaryDbContext dbContext,
    IEmailService emailService,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IGeoLocationService geoLocationService
) : Endpoint<ConfirmDeleteMerchantRequest, ConfirmDeleteMerchantResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/confirm-delete");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ConfirmDeleteMerchantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ConfirmDeleteMerchantResponse
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
            .Include(m => m.MerchantApiCredentials)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ConfirmDeleteMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Deleted)
        {
            await Send.ResponseAsync(new ConfirmDeleteMerchantResponse
            {
                Error = new("Esta organização já foi excluída.")
            }, 400, ct);
            return;
        }

        var codeHash = CryptoUtils.ComputeSha256Hash(req.Code);

        var deletionCode = await dbContext.MerchantDeletionCodes
            .Where(c => c.MerchantId == req.MerchantId && c.CodeHash == codeHash)
            .OrderByDescending(c => c.CreatedAt)
            .OrderBy(x => x.Id)
            .FirstOrDefaultAsync(ct);

        if (deletionCode == null)
        {
            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.MerchantDeleted,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código de exclusão inválido para merchant {merchant.Id}"
            });

            await Send.ResponseAsync(new ConfirmDeleteMerchantResponse
            {
                Error = new("Código de confirmação inválido.")
            }, 400, ct);
            return;
        }

        // Check if code is expired and update status
        if (deletionCode.IsExpired && deletionCode.Status == MerchantDeletionCodeStatus.Pending)
        {
            deletionCode.Status = MerchantDeletionCodeStatus.ExpiredByTime;
            await dbContext.SaveChangesAsync(ct);
        }

        if (!deletionCode.IsValid)
        {
            var message = deletionCode.IsExpired
                ? "Código de confirmação expirado. Solicite um novo código."
                : "Código de confirmação já utilizado.";

            await securityLog.LogAsync(new SecurityLogInput
            {
                Action = SecurityLogAction.MerchantDeleted,
                Status = SecurityLogStatus.Failed,
                UserId = userId,
                Details = $"Código de exclusão inválido para merchant {merchant.Id}: {message}"
            });

            await Send.ResponseAsync(new ConfirmDeleteMerchantResponse
            {
                Error = new(message)
            }, 400, ct);
            return;
        }

        // Mark code as used
        deletionCode.Status = MerchantDeletionCodeStatus.Used;

        // Soft delete the merchant
        merchant.Status = MerchantStatus.Deleted;
        merchant.DeletedAt = DateTime.UtcNow;
        merchant.DeletedReason = "Exclusão solicitada pelo usuário";
        merchant.UpdatedAt = DateTime.UtcNow;

        // Revoke all API credentials
        foreach (var credential in merchant.MerchantApiCredentials)
        {
            if (credential.Status != MerchantApiCredentialStatus.Revoked)
            {
                credential.Status = MerchantApiCredentialStatus.Revoked;
                credential.UpdatedAt = DateTime.UtcNow;
            }
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantDeleted,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Merchant {merchant.Id} ({merchant.Name}) excluído com sucesso"
        });

        // Create notification (await to avoid DbContext disposal issues)
        try
        {
            await notificationService.CreateAsync(
                merchant.Id,
                NotificationType.System,
                "Organização excluída",
                $"A organização '{merchant.Name ?? "Sua organização"}' foi excluída permanentemente. Você ainda pode consultar métricas, saldo e realizar saques.",
                NotificationPriority.High
            );
        }
        catch
        {
            // Don't fail the request if notification fails
        }

        // Send confirmation email (await to avoid DbContext disposal issues)
        var now = DateTime.UtcNow;
        var brazilTime = TimeZoneInfo.ConvertTimeFromUtc(now, DateTimeUtils.BrasiliaTimeZone);

        await SendDeletionConfirmationEmailAsync(merchant.User, merchant, ipAddress, location, brazilTime);

        await Send.OkAsync(new ConfirmDeleteMerchantResponse
        {
            Message = "Organização excluída com sucesso. Você ainda pode consultar métricas, saldo e realizar saques."
        }, ct);
    }

    private async Task SendDeletionConfirmationEmailAsync(User user, Merchant merchant, string ipAddress, string location, DateTime brazilTime)
    {
        try
        {
            await emailService.SendAsync(
                user.Email,
                "🗑️ Sua organização foi excluída - SwiftPay",
                EmailTemplate.MerchantDeleted,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name },
                    { "MERCHANT_NAME", merchant.Name ?? "Sua organização" },
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

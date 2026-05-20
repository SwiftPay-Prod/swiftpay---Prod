using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Email;
using safefy_api_core.Interfaces;

namespace safefy_api.Endpoints.Admin.Merchants.InactivateMerchant;

public sealed class InactivateMerchantEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IEmailService emailService
) : Endpoint<InactivateMerchantRequest, InactivateMerchantResponse>
{
    public override void Configure()
    {
        Post("merchants/{merchantId:guid}/inactivate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(InactivateMerchantRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new InactivateMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new InactivateMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Deleted)
        {
            await Send.ResponseAsync(new InactivateMerchantResponse
            {
                Error = new("Não é possível inativar uma organização excluída.")
            }, 400, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new InactivateMerchantResponse
            {
                Error = new("Apenas organizações ativas podem ser inativadas.")
            }, 400, ct);
            return;
        }

        var allowedKycStatuses = new[] { MerchantKycStatus.Pending, MerchantKycStatus.UnderReview, MerchantKycStatus.Approved };
        if (!allowedKycStatuses.Contains(merchant.KycStatus))
        {
            await Send.ResponseAsync(new InactivateMerchantResponse
            {
                Error = new("Apenas organizações com KYC pendente, em análise ou aprovado podem ser inativadas.")
            }, 400, ct);
            return;
        }

        var previousStatus = merchant.Status;

        merchant.Status = MerchantStatus.Inactive;
        merchant.InactiveReason = req.Reason;
        merchant.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantStatusChange,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Organização {merchant.Id} inativada. Status anterior: {previousStatus}. Motivo: {req.Reason}"
        });

        await notificationService.CreateSecurityNotificationAsync(
            merchant.Id,
            "Organização Inativada",
            $"Sua organização foi inativada. Motivo: {req.Reason}",
            requiresMerchantRefresh: true
        );

        var user = await dbContext.Users
            .OrderBy(u => u.Id)
            .FirstOrDefaultAsync(u => u.Id == merchant.UserId, ct);

        if (user != null)
        {
            await emailService.SendAsync(
                user.Email,
                "Sua organização foi inativada",
                EmailTemplate.MerchantInactivated,
                new Dictionary<string, string>
                {
                    { "NAME", user.Name ?? "Usuário" },
                    { "MERCHANT_NAME", merchant.Name ?? "Organização" },
                    { "REASON", req.Reason }
                },
                user.Id,
                merchant.Id
            );
        }

        await Send.OkAsync(new InactivateMerchantResponse
        {
            Data = new("Organização inativada com sucesso.")
        }, ct);
    }
}

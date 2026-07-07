using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Merchants.ActivateMerchant;

public sealed class ActivateMerchantEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService
) : Endpoint<ActivateMerchantRequest, ActivateMerchantResponse>
{
    public override void Configure()
    {
        Post("merchants/{merchantId:guid}/activate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ActivateMerchantRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ActivateMerchantResponse
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
            await Send.ResponseAsync(new ActivateMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ActivateMerchantResponse
            {
                Error = new("A organização já está ativa.")
            }, 400, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Deleted)
        {
            await Send.ResponseAsync(new ActivateMerchantResponse
            {
                Error = new("Não é possível ativar uma organização excluída.")
            }, 400, ct);
            return;
        }

        var allowedStatuses = new[] { MerchantStatus.Inactive, MerchantStatus.Suspended };
        if (!allowedStatuses.Contains(merchant.Status))
        {
            await Send.ResponseAsync(new ActivateMerchantResponse
            {
                Error = new("Apenas organizações inativas ou suspensas podem ser ativadas.")
            }, 400, ct);
            return;
        }

        var allowedKycStatuses = new[] { MerchantKycStatus.Pending, MerchantKycStatus.UnderReview, MerchantKycStatus.Approved };
        if (!allowedKycStatuses.Contains(merchant.KycStatus))
        {
            await Send.ResponseAsync(new ActivateMerchantResponse
            {
                Error = new("Apenas organizações com KYC pendente, em análise ou aprovado podem ser ativadas.")
            }, 400, ct);
            return;
        }

        var previousStatus = merchant.Status;

        merchant.Status = MerchantStatus.Active;
        merchant.SuspendedReason = null;
        merchant.InactiveReason = null;
        merchant.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        var reasonLog = string.IsNullOrWhiteSpace(req.Reason) ? "" : $" Motivo: {req.Reason}";
        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantStatusChange,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Organização {merchant.Id} ativada. Status anterior: {previousStatus}.{reasonLog}"
        });

        await notificationService.CreateSuccessNotificationAsync(
            merchant.Id,
            "Organização Ativada",
            "Sua organização foi ativada e está pronta para operar."
        );

        await Send.OkAsync(new ActivateMerchantResponse
        {
            Data = new("Organização ativada com sucesso.")
        }, ct);
    }
}

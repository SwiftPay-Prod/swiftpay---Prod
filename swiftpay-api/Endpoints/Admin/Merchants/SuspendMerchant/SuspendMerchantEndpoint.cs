using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Merchants.SuspendMerchant;

public sealed class SuspendMerchantEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    INotificationService notificationService,
    IEmailIntentWriter emailIntentWriter
) : Endpoint<SuspendMerchantRequest, SuspendMerchantResponse>
{
    public override void Configure()
    {
        Post("merchants/{merchantId:guid}/suspend");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(SuspendMerchantRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new SuspendMerchantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.User)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new SuspendMerchantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status == MerchantStatus.Deleted)
        {
            await Send.ResponseAsync(new SuspendMerchantResponse
            {
                Error = new("Não é possível suspender uma organização excluída.")
            }, 400, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new SuspendMerchantResponse
            {
                Error = new("Apenas organizações ativas podem ser suspensas.")
            }, 400, ct);
            return;
        }

        var allowedKycStatuses = new[] { MerchantKycStatus.Pending, MerchantKycStatus.UnderReview, MerchantKycStatus.Approved };
        if (!allowedKycStatuses.Contains(merchant.KycStatus))
        {
            await Send.ResponseAsync(new SuspendMerchantResponse
            {
                Error = new("Apenas organizações com KYC pendente, em análise ou aprovado podem ser suspensas.")
            }, 400, ct);
            return;
        }

        var previousStatus = merchant.Status;

        merchant.Status = MerchantStatus.Suspended;
        merchant.SuspendedReason = req.Reason;
        merchant.UpdatedAt = DateTime.UtcNow;

        await emailIntentWriter.Add(new EmailIntentAddRequest
        {
            Dedupe = EmailIntentDedupeKey.BusinessTransition(
                EmailMessageType.MerchantSuspended,
                merchant.Id,
                merchant.Id),
            MessageType = EmailMessageType.MerchantSuspended,
            RecipientAddress = merchant.User.Email,
            Owner = new(EmailIntentOwnerType.Merchant, merchant.Id),
            CorrelationId = HttpContext.TraceIdentifier,
            Inputs = new Dictionary<string, string>
            {
                ["NAME"] = merchant.User.Name ?? "Usuário",
                ["MERCHANT_NAME"] = merchant.Name ?? "Organização",
                ["REASON"] = req.Reason
            }
        }, ct);

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantStatusChange,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Organização {merchant.Id} suspensa. Status anterior: {previousStatus}. Motivo: {req.Reason}"
        });

        await notificationService.CreateSecurityNotificationAsync(
            merchant.Id,
            "Organização Suspensa",
            $"Sua organização foi suspensa. Motivo: {req.Reason}",
            requiresMerchantRefresh: true
        );


        await Send.OkAsync(new SuspendMerchantResponse
        {
            Data = new("Organização suspensa com sucesso.")
        }, ct);
    }
}

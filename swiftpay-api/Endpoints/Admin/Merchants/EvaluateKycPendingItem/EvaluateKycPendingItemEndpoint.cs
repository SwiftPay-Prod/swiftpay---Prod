using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Endpoints.Admin.Merchants.EvaluateKycPendingItem;

public sealed class EvaluateKycPendingItemEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog
) : Endpoint<EvaluateKycPendingItemRequest, EvaluateKycPendingItemResponse>
{
    public override void Configure()
    {
        Post("merchant/{merchantId:guid}/pending-items/{itemId:guid}/evaluate");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(EvaluateKycPendingItemRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new EvaluateKycPendingItemResponse
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
            await Send.ResponseAsync(new EvaluateKycPendingItemResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var pendingItem = await dbContext.MerchantKycPendingItems
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ItemId && p.MerchantId == req.MerchantId, ct);

        if (pendingItem == null)
        {
            await Send.ResponseAsync(new EvaluateKycPendingItemResponse
            {
                Error = new("Item pendente não encontrado.")
            }, 404, ct);
            return;
        }

        if (pendingItem.Status != MerchantKycPendingItemStatus.Responded)
        {
            await Send.ResponseAsync(new EvaluateKycPendingItemResponse
            {
                Error = new("Apenas itens respondidos podem ser avaliados.")
            }, 400, ct);
            return;
        }

        var now = DateTime.UtcNow;

        pendingItem.Status = req.Status == KycPendingItemEvaluationStatus.Approved
            ? MerchantKycPendingItemStatus.Approved
            : MerchantKycPendingItemStatus.Rejected;
        pendingItem.AdminNotes = req.Notes;
        pendingItem.EvaluatedAt = now;
        pendingItem.UpdatedAt = now;

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.MerchantKycComplement,
            Status = SecurityLogStatus.Success,
            UserId = adminId,
            Details = $"Pending item {pendingItem.Id} evaluated as {req.Status} for merchant {merchant.Id}"
        });

        await Send.OkAsync(new EvaluateKycPendingItemResponse
        {
            Data = new EvaluateKycPendingItemData
            {
                Id = pendingItem.Id,
                Status = pendingItem.Status.ToString(),
                AdminNotes = pendingItem.AdminNotes,
                EvaluatedAt = pendingItem.EvaluatedAt
            },
            Message = req.Status == KycPendingItemEvaluationStatus.Approved
                ? "Item aprovado com sucesso."
                : "Item rejeitado."
        }, ct);
    }
}

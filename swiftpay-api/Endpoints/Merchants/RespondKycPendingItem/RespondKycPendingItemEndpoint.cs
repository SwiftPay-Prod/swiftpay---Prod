using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Merchants.Shared;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.RespondKycPendingItem;

public sealed class RespondKycPendingItemEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<RespondKycPendingItemRequest, RespondKycPendingItemResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/pending-items/{itemId:guid}/respond");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(RespondKycPendingItemRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RespondKycPendingItemResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .Include(m => m.MerchantKyc)
            .Include(m => m.MerchantKycPendingItems)
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new RespondKycPendingItemResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.KycStatus != MerchantKycStatus.Complement)
        {
            await Send.ResponseAsync(new RespondKycPendingItemResponse
            {
                Error = new("A organização não está em status de complemento.")
            }, 400, ct);
            return;
        }

        var pendingItem = merchant.MerchantKycPendingItems
            .FirstOrDefault(i => i.Id == req.ItemId);

        if (pendingItem == null)
        {
            await Send.ResponseAsync(new RespondKycPendingItemResponse
            {
                Error = new("Item pendente não encontrado.")
            }, 404, ct);
            return;
        }

        if (pendingItem.Status != MerchantKycPendingItemStatus.Pending)
        {
            await Send.ResponseAsync(new RespondKycPendingItemResponse
            {
                Error = new("Este item já foi respondido.")
            }, 400, ct);
            return;
        }

        pendingItem.Response = req.Response;
        pendingItem.Status = MerchantKycPendingItemStatus.Responded;
        pendingItem.RespondedAt = DateTime.UtcNow;

        var allItemsRespondedOrApproved = merchant.MerchantKycPendingItems
            .All(i => i.Status != MerchantKycPendingItemStatus.Pending);

        if (allItemsRespondedOrApproved)
        {
            // Validar cadastro completo antes de mudar para UnderReview
            var validationErrors = MerchantValidator.ValidateOnboardingComplete(merchant);
            if (validationErrors.Count > 0)
            {
                await Send.ResponseAsync(new RespondKycPendingItemResponse
                {
                    Error = new(string.Join(" ", validationErrors))
                }, 400, ct);
                return;
            }

            merchant.KycStatus = MerchantKycStatus.UnderReview;
            merchant.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(ct);

        var message = allItemsRespondedOrApproved
            ? "Todos os itens foram respondidos. Sua organização voltou para análise."
            : "Resposta enviada com sucesso.";

        await Send.ResponseAsync(new RespondKycPendingItemResponse
        {
            Message = message
        }, cancellation: ct);
    }
}

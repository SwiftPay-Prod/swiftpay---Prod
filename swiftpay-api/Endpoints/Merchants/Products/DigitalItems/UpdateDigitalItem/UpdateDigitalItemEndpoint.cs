using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Merchants.Products.DigitalItems.CreateDigitalItem;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Products.DigitalItems.UpdateDigitalItem;

public sealed class UpdateDigitalItemEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateDigitalItemRequest, UpdateDigitalItemResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/products/{productId:guid}/digital-items/{itemId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateDigitalItemRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateDigitalItemResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new UpdateDigitalItemResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new UpdateDigitalItemResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        var digitalItem = await dbContext.DigitalItems
            .OrderBy(di => di.Id)
            .FirstOrDefaultAsync(di => di.Id == req.ItemId && di.ProductId == req.ProductId, ct);

        if (digitalItem == null)
        {
            await Send.ResponseAsync(new UpdateDigitalItemResponse
            {
                Error = new("Item digital não encontrado.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.Content))
        {
            var existingItem = await dbContext.DigitalItems
                .AsNoTracking()
                .OrderBy(di => di.Id)
                .FirstOrDefaultAsync(di => di.ProductId == req.ProductId && di.Content == req.Content.Trim() && di.Id != req.ItemId, ct);

            if (existingItem != null)
            {
                await Send.ResponseAsync(new UpdateDigitalItemResponse
                {
                    Error = new("Este conteúdo já existe neste produto.")
                }, 400, ct);
                return;
            }

            digitalItem.Content = req.Content.Trim();
        }

        if (req.Label != null)
            digitalItem.Label = string.IsNullOrWhiteSpace(req.Label) ? null : req.Label.Trim();

        if (req.Status.HasValue)
        {
            if (req.Status == DigitalItemStatus.Delivered)
            {
                digitalItem.DeliveredAt = DateTime.UtcNow;
            }
            else if (digitalItem.Status == DigitalItemStatus.Delivered && req.Status != DigitalItemStatus.Delivered)
            {
                digitalItem.DeliveredAt = null;
                digitalItem.DeliveredToOrderId = null;
            }
            digitalItem.Status = req.Status.Value;
        }

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateDigitalItemResponse
        {
            Data = DigitalItemMapper.ToData(digitalItem),
            Message = "Item digital atualizado com sucesso!"
        }, ct);
    }
}

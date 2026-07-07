using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Products.DigitalItems.DeleteDigitalItem;

public sealed class DeleteDigitalItemEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteDigitalItemRequest, DeleteDigitalItemResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/products/{productId:guid}/digital-items/{itemId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteDigitalItemRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteDigitalItemResponse
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
            await Send.ResponseAsync(new DeleteDigitalItemResponse
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
            await Send.ResponseAsync(new DeleteDigitalItemResponse
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
            await Send.ResponseAsync(new DeleteDigitalItemResponse
            {
                Error = new("Item digital não encontrado.")
            }, 404, ct);
            return;
        }

        if (digitalItem.Status == DigitalItemStatus.Delivered)
        {
            await Send.ResponseAsync(new DeleteDigitalItemResponse
            {
                Error = new("Não é possível excluir um item que já foi entregue. Você pode desativá-lo se necessário.")
            }, 400, ct);
            return;
        }

        dbContext.DigitalItems.Remove(digitalItem);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteDigitalItemResponse
        {
            Message = "Item digital excluído com sucesso!"
        }, ct);
    }
}

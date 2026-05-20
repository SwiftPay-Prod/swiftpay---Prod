using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Variants.DeleteVariant;

public sealed class DeleteVariantEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteVariantRequest, DeleteVariantResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/products/{productId:guid}/variants/{variantId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteVariantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteVariantResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new DeleteVariantResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new DeleteVariantResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        var variant = await dbContext.Variants
            .OrderBy(v => v.Id)
            .FirstOrDefaultAsync(v => v.Id == req.VariantId && v.ProductId == req.ProductId, ct);

        if (variant == null)
        {
            await Send.ResponseAsync(new DeleteVariantResponse
            {
                Error = new("Variante não encontrada.")
            }, 404, ct);
            return;
        }

        var hasOrderItems = await dbContext.OrderItems
            .AnyAsync(oi => oi.VariantId == req.VariantId, ct);

        if (hasOrderItems)
        {
            await Send.ResponseAsync(new DeleteVariantResponse
            {
                Error = new("Não é possível excluir a variante pois ela possui pedidos vinculados.")
            }, 400, ct);
            return;
        }

        dbContext.Variants.Remove(variant);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new DeleteVariantResponse
        {
            Message = "Variante excluída com sucesso!"
        }, 200, ct);
    }
}

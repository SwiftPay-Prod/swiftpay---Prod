using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Products.DeleteProduct;

public sealed class DeleteProductEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteProductRequest, DeleteProductResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/products/{productId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteProductRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteProductResponse
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
            await Send.ResponseAsync(new DeleteProductResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .Include(p => p.Variants)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new DeleteProductResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        dbContext.Variants.RemoveRange(product.Variants);
        dbContext.Products.Remove(product);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteProductResponse
        {
            Message = "Produto excluído com sucesso!"
        }, ct);
    }
}

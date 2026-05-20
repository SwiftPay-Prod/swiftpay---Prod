using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Variants.ReadVariant;

public sealed class ReadVariantEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadVariantRequest, ReadVariantResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/products/{productId:guid}/variants/{variantId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadVariantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadVariantResponse
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
            await Send.ResponseAsync(new ReadVariantResponse
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
            await Send.ResponseAsync(new ReadVariantResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        var variant = await dbContext.Variants
            .Include(v => v.Product)
            .OrderBy(v => v.Id)
            .FirstOrDefaultAsync(v => v.Id == req.VariantId && v.ProductId == req.ProductId, ct);

        if (variant == null)
        {
            await Send.ResponseAsync(new ReadVariantResponse
            {
                Error = new("Variante não encontrada.")
            }, 404, ct);
            return;
        }

        await Send.ResponseAsync(new ReadVariantResponse
        {
            Data = VariantMapper.ToData(variant)
        }, 200, ct);
    }
}

using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Merchants.Variants.UpdateVariant;

public sealed class UpdateVariantEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateVariantRequest, UpdateVariantResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/products/{productId:guid}/variants/{variantId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateVariantRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateVariantResponse
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
            await Send.ResponseAsync(new UpdateVariantResponse
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
            await Send.ResponseAsync(new UpdateVariantResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        if (product.IsUnlimitedDigitalStock && req.StockQuantity.HasValue)
        {
            await Send.ResponseAsync(new UpdateVariantResponse
            {
                Error = new("Não é permitido definir estoque quando o produto está com estoque ilimitado.")
            }, 400, ct);
            return;
        }

        var variant = await dbContext.Variants
            .Include(v => v.Product)
            .OrderBy(v => v.Id)
            .FirstOrDefaultAsync(v => v.Id == req.VariantId && v.ProductId == req.ProductId, ct);

        if (variant == null)
        {
            await Send.ResponseAsync(new UpdateVariantResponse
            {
                Error = new("Variante não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.ExternalId != null && req.ExternalId != variant.ExternalId)
        {
            var externalIdExists = await dbContext.Variants
                .AnyAsync(v => v.ProductId == req.ProductId && v.ExternalId == req.ExternalId && v.Id != req.VariantId, ct);

            if (externalIdExists)
            {
                await Send.ResponseAsync(new UpdateVariantResponse
                {
                    Error = new("Já existe uma variante com este ID externo neste produto.")
                }, 400, ct);
                return;
            }

            variant.ExternalId = req.ExternalId;
        }

        if (req.Name != null) variant.Name = req.Name;
        if (req.SKU != null) variant.SKU = req.SKU;
        if (req.Price.HasValue) variant.Price = req.Price.Value;
        if (req.StockQuantity.HasValue) variant.StockQuantity = req.StockQuantity.Value;
        if (req.ImageUrl != null) variant.ImageUrl = req.ImageUrl;
        if (req.Status.HasValue) variant.Status = req.Status.Value;

        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new UpdateVariantResponse
        {
            Data = VariantMapper.ToData(variant),
            Message = "Variante atualizada com sucesso!"
        }, 200, ct);
    }
}

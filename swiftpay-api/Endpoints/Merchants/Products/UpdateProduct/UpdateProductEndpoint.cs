using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Products.UpdateProduct;

public sealed class UpdateProductEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateProductRequest, UpdateProductResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/products/{productId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateProductRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateProductResponse
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
            await Send.ResponseAsync(new UpdateProductResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var product = await dbContext.Products
            .Include(p => p.Categories)
            .Include(p => p.Variants)
            .Include(p => p.Coupons)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId && p.MerchantId == req.MerchantId, ct);

        if (product == null)
        {
            await Send.ResponseAsync(new UpdateProductResponse
            {
                Error = new("Produto não encontrado.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId) && req.ExternalId != product.ExternalId)
        {
            var existingByExternalId = await dbContext.Products
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(p => p.MerchantId == req.MerchantId && p.Environment == product.Environment && p.ExternalId == req.ExternalId && p.Id != req.ProductId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new UpdateProductResponse
                {
                    Error = new("Já existe um produto com este ID externo.")
                }, 400, ct);
                return;
            }
        }

        if (req.CategoryIds != null)
        {
            var categories = await dbContext.Categories
                .Where(c => c.MerchantId == req.MerchantId && c.Environment == product.Environment && req.CategoryIds.Contains(c.Id))
                .ToListAsync(ct);

            if (categories.Count != req.CategoryIds.Count)
            {
                await Send.ResponseAsync(new UpdateProductResponse
                {
                    Error = new("Uma ou mais categorias não foram encontradas.")
                }, 400, ct);
                return;
            }

            product.Categories.Clear();
            foreach (var category in categories)
            {
                product.Categories.Add(category);
            }
        }

        if (req.CouponIds != null)
        {
            var coupons = await dbContext.Coupons
                .Where(c => c.MerchantId == req.MerchantId && c.Environment == product.Environment && req.CouponIds.Contains(c.Id))
                .ToListAsync(ct);

            if (coupons.Count != req.CouponIds.Count)
            {
                await Send.ResponseAsync(new UpdateProductResponse
                {
                    Error = new("Um ou mais cupons não foram encontrados.")
                }, 400, ct);
                return;
            }

            product.Coupons.Clear();
            foreach (var coupon in coupons)
            {
                product.Coupons.Add(coupon);
            }
        }

        var nextType = req.Type ?? product.Type;

        if (req.IsUnlimitedDigitalStock == true && nextType == ProductType.Digital)
        {
            var hasInvalidCount = await dbContext.DigitalItems
                .AsNoTracking()
                .Where(di => di.ProductId == product.Id)
                .GroupBy(di => di.VariantId)
                .AnyAsync(group => group.Count() > 1, ct);

            if (hasInvalidCount)
            {
                await Send.ResponseAsync(new UpdateProductResponse
                {
                    Error = new("Este produto está com estoque ilimitado e permite apenas 1 item digital por variante.")
                }, 400, ct);
                return;
            }
        }

        if (req.ExternalId != null) product.ExternalId = req.ExternalId;
        if (req.Name != null) product.Name = req.Name;
        if (req.Type.HasValue) product.Type = req.Type.Value;
        if (req.ImageUrls != null)
        {
            var normalizedImageUrls = req.ImageUrls
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .Select(url => url.Trim())
                .Take(6)
                .ToList();

            product.ImageUrls = normalizedImageUrls;
            product.ImageUrl = normalizedImageUrls.FirstOrDefault();
        }
        else if (req.ImageUrl != null)
        {
            var normalizedImageUrl = req.ImageUrl.Trim();
            product.ImageUrl = normalizedImageUrl;
            product.ImageUrls = string.IsNullOrWhiteSpace(normalizedImageUrl) ? [] : [normalizedImageUrl];
        }
        if (req.Description != null) product.Description = req.Description;
        if (req.Brand != null) product.Brand = req.Brand;
        if (req.Price.HasValue) product.Price = req.Price.Value;

        var isUnlimitedDigitalStock = req.IsUnlimitedDigitalStock ?? product.IsUnlimitedDigitalStock;
        if (req.IsUnlimitedDigitalStock.HasValue) product.IsUnlimitedDigitalStock = req.IsUnlimitedDigitalStock.Value;

        if (!isUnlimitedDigitalStock)
        {
            if (req.StockQuantity.HasValue) product.StockQuantity = req.StockQuantity.Value;
            if (req.ClearStockQuantity) product.StockQuantity = null;
        }
        if (req.Status.HasValue) product.Status = req.Status.Value;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateProductResponse
        {
            Data = ProductMapper.ToData(product),
            Message = "Produto atualizado com sucesso!"
        }, ct);
    }
}

using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Products.CreateProduct;

public sealed class CreateProductEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateProductRequest, CreateProductResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/products");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateProductRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateProductResponse
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
            await Send.ResponseAsync(new CreateProductResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (!string.IsNullOrWhiteSpace(req.ExternalId))
        {
            var existingByExternalId = await dbContext.Products
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(p => p.MerchantId == req.MerchantId && p.ExternalId == req.ExternalId, ct);

            if (existingByExternalId != null)
            {
                await Send.ResponseAsync(new CreateProductResponse
                {
                    Error = new("Já existe um produto com este ID externo neste ambiente.")
                }, 400, ct);
                return;
            }
        }

        var categories = new List<Category>();
        if (req.CategoryIds != null && req.CategoryIds.Count > 0)
        {
            categories = await dbContext.Categories
                .Where(c => c.MerchantId == req.MerchantId && req.CategoryIds.Contains(c.Id))
                .ToListAsync(ct);

            if (categories.Count != req.CategoryIds.Count)
            {
                await Send.ResponseAsync(new CreateProductResponse
                {
                    Error = new("Uma ou mais categorias não foram encontradas ou não pertencem a este ambiente.")
                }, 400, ct);
                return;
            }
        }

        var coupons = new List<Coupon>();
        if (req.CouponIds != null && req.CouponIds.Count > 0)
        {
            coupons = await dbContext.Coupons
                .Where(c => c.MerchantId == req.MerchantId && req.CouponIds.Contains(c.Id))
                .ToListAsync(ct);

            if (coupons.Count != req.CouponIds.Count)
            {
                await Send.ResponseAsync(new CreateProductResponse
                {
                    Error = new("Um ou mais cupons não foram encontrados ou não pertencem a este ambiente.")
                }, 400, ct);
                return;
            }
        }

        var normalizedImageUrls = req.ImageUrls
            ?.Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .Take(6)
            .ToList() ?? [];

        if (normalizedImageUrls.Count == 0 && !string.IsNullOrWhiteSpace(req.ImageUrl))
        {
            normalizedImageUrls.Add(req.ImageUrl.Trim());
        }

        var primaryImageUrl = normalizedImageUrls.FirstOrDefault() ?? req.ImageUrl;

        var product = new Product
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            ExternalId = req.ExternalId,
            Name = req.Name,
            Type = req.Type,
            ImageUrl = primaryImageUrl,
            ImageUrls = normalizedImageUrls,
            Description = req.Description,
            Brand = req.Brand,
            Price = req.Price,
            StockQuantity = req.StockQuantity,
            IsUnlimitedDigitalStock = req.IsUnlimitedDigitalStock,
            Status = ProductStatus.Active,
            Environment = environmentProvider.CurrentEnvironment,
            Categories = categories,
            Coupons = coupons
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(ct);

        await dbContext.Entry(product)
            .Collection(p => p.Categories)
            .LoadAsync(ct);

        await dbContext.Entry(product)
            .Collection(p => p.Coupons)
            .LoadAsync(ct);

        await Send.CreatedAtAsync<CreateProductEndpoint>(null, new CreateProductResponse
        {
            Data = ProductMapper.ToData(product),
            Message = "Produto criado com sucesso!"
        }, cancellation: ct);
    }
}

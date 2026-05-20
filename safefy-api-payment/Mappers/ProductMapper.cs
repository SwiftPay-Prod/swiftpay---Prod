using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Products.List;

namespace safefy_api_payment.Mappers;

public static class ProductMapper
{
    public static ProductData ToData(Product product)
    {
        return new ProductData
        {
            Id = product.Id,
            ExternalId = product.ExternalId,
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            ImageUrl = product.ImageUrl,
            Type = product.Type,
            Status = product.Status,
            Categories = product.Categories?.Select(c => new ProductCategoryData
            {
                Id = c.Id,
                ExternalId = c.ExternalId,
                Name = c.Name,
                Status = c.Status
            }).ToList() ?? [],
            Variants = product.Variants?.Select(v => new ProductVariantData
            {
                Id = v.Id,
                ExternalId = v.ExternalId,
                Name = v.Name,
                SKU = v.SKU,
                Price = v.Price,
                StockQuantity = v.StockQuantity ?? 0,
                ImageUrl = v.ImageUrl,
                Status = v.Status
            }).ToList() ?? [],
            CreatedAt = product.CreatedAt
        };
    }
}

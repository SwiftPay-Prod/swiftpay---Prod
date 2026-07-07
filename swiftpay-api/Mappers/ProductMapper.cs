using swiftpay_api.Endpoints.Merchants.Products;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class ProductMapper
{
    public static ProductData ToData(Product product)
    {
        return new ProductData
        {
            Id = product.Id,
            ExternalId = product.ExternalId,
            Name = product.Name,
            Type = product.Type,
            ImageUrl = product.ImageUrl,
            ImageUrls = product.ImageUrls ?? [],
            Description = product.Description,
            Brand = product.Brand,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            IsUnlimitedDigitalStock = product.IsUnlimitedDigitalStock,
            Status = product.Status,
            Environment = product.Environment,
            DigitalItemsPerPurchase = product.DigitalItemsPerPurchase,
            DigitalItemsCount = product.DigitalItems?.Count(di => di.Status == DigitalItemStatus.Available) ?? 0,
            DurationMinutes = product.DurationMinutes,
            LocationType = product.LocationType,
            Categories = product.Categories?.Select(CategoryMapper.ToMinimalData).ToList() ?? [],
            Variants = product.Variants?.Select(VariantMapper.ToData).ToList() ?? [],
            Coupons = product.Coupons?.Select(ToCouponData).ToList() ?? [],
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt
        };
    }

    public static MinimalProduct ToMinimalData(Product product)
    {
        return new MinimalProduct
        {
            Id = product.Id,
            ExternalId = product.ExternalId,
            Name = product.Name,
            Type = product.Type,
            ImageUrl = product.ImageUrl,
            ImageUrls = product.ImageUrls ?? [],
            Description = product.Description,
            Brand = product.Brand,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            IsUnlimitedDigitalStock = product.IsUnlimitedDigitalStock,
            Status = product.Status,
            Environment = product.Environment,
            DigitalItemsPerPurchase = product.DigitalItemsPerPurchase,
            DigitalItemsCount = product.DigitalItems?.Count(di => di.Status == DigitalItemStatus.Available) ?? 0,
            DurationMinutes = product.DurationMinutes,
            LocationType = product.LocationType,
            CategoryCount = product.Categories?.Count ?? 0,
            VariantCount = product.Variants?.Count ?? 0,
            CouponCount = product.Coupons?.Count ?? 0,
            CreatedAt = product.CreatedAt
        };
    }

    private static ProductCouponData ToCouponData(Coupon coupon)
    {
        return new ProductCouponData
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Name = coupon.Name,
            DiscountType = coupon.DiscountType,
            DiscountFixedAmount = coupon.DiscountFixedAmount,
            DiscountPercentage = coupon.DiscountPercentage,
            Status = coupon.Status,
            CurrentUses = coupon.CurrentUses,
            MaxUses = coupon.MaxUses
        };
    }
}

public static class CategoryMapper
{
    public static CategoryData ToData(Category category)
    {
        return new CategoryData
        {
            Id = category.Id,
            ExternalId = category.ExternalId,
            Name = category.Name,
            Description = category.Description,
            Status = category.Status,
            Environment = category.Environment,
            ProductCount = category.Products?.Count ?? 0,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    public static MinimalCategory ToMinimalData(Category category)
    {
        return new MinimalCategory
        {
            Id = category.Id,
            ExternalId = category.ExternalId,
            Name = category.Name,
            Description = category.Description,
            Status = category.Status,
            Environment = category.Environment,
            ProductCount = category.Products?.Count ?? 0,
            CreatedAt = category.CreatedAt
        };
    }
}

public static class VariantMapper
{
    public static VariantData ToData(Variant variant)
    {
        return new VariantData
        {
            Id = variant.Id,
            ProductId = variant.ProductId,
            ExternalId = variant.ExternalId,
            Name = variant.Name,
            SKU = variant.SKU,
            Price = variant.Price,
            StockQuantity = variant.StockQuantity,
            ImageUrl = variant.ImageUrl,
            Status = variant.Status,
            CreatedAt = variant.CreatedAt,
            UpdatedAt = variant.UpdatedAt
        };
    }

    public static MinimalVariant ToMinimalData(Variant variant)
    {
        return new MinimalVariant
        {
            Id = variant.Id,
            ProductId = variant.ProductId,
            ExternalId = variant.ExternalId,
            Name = variant.Name,
            SKU = variant.SKU,
            Price = variant.Price,
            StockQuantity = variant.StockQuantity,
            Status = variant.Status,
            CreatedAt = variant.CreatedAt
        };
    }
}

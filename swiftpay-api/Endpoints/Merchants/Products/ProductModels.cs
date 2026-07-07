using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Products;

public sealed class ProductData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public ProductType Type { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = [];
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public long? Price { get; set; }
    public int? StockQuantity { get; set; }
    public bool IsUnlimitedDigitalStock { get; set; }
    public ProductStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public int DigitalItemsPerPurchase { get; set; }
    public int DigitalItemsCount { get; set; }
    public int? DurationMinutes { get; set; }
    public ServiceLocationType? LocationType { get; set; }
    public ICollection<MinimalCategory> Categories { get; set; } = [];
    public ICollection<VariantData> Variants { get; set; } = [];
    public ICollection<ProductCouponData> Coupons { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class ProductCouponData
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string? Name { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public int? DiscountPercentage { get; set; }
    public CouponStatus Status { get; set; }
    public int CurrentUses { get; set; }
    public int? MaxUses { get; set; }
}

public sealed class MinimalProduct
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public ProductType Type { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = [];
    public string? Description { get; set; }
    public string? Brand { get; set; }
    public long? Price { get; set; }
    public int? StockQuantity { get; set; }
    public bool IsUnlimitedDigitalStock { get; set; }
    public ProductStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public int DigitalItemsPerPurchase { get; set; }
    public int DigitalItemsCount { get; set; }
    public int? DurationMinutes { get; set; }
    public ServiceLocationType? LocationType { get; set; }
    public int CategoryCount { get; set; }
    public int VariantCount { get; set; }
    public int CouponCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CategoryData
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public CategoryStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public int ProductCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MinimalCategory
{
    public Guid Id { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public CategoryStatus Status { get; set; }
    public ApiEnvironment Environment { get; set; }
    public int ProductCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class VariantData
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? SKU { get; set; }
    public long Price { get; set; }
    public int? StockQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public VariantStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MinimalVariant
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string? ExternalId { get; set; }
    public string Name { get; set; } = null!;
    public string? SKU { get; set; }
    public long Price { get; set; }
    public int? StockQuantity { get; set; }
    public VariantStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

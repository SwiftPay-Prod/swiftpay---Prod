using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Coupons;

public sealed class CouponData
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string? Name { get; set; }
    public string? Description { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? MaxDiscountAmount { get; set; }
    public long? MinOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    public int CurrentUses { get; set; }
    public int? MaxUsesPerCustomer { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public CouponStatus Status { get; set; }
    public bool ApplyToAllProducts { get; set; }
    public bool ApplyToAllCheckouts { get; set; }
    public ApiEnvironment Environment { get; set; }
    public ICollection<CouponProductInfo> Products { get; set; } = [];
    public ICollection<CouponCheckoutInfo> Checkouts { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class MinimalCoupon
{
    public Guid Id { get; set; }
    public string Code { get; set; } = null!;
    public string? Name { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? MaxDiscountAmount { get; set; }
    public int? MaxUses { get; set; }
    public int CurrentUses { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public CouponStatus Status { get; set; }
    public bool ApplyToAllProducts { get; set; }
    public bool ApplyToAllCheckouts { get; set; }
    public ApiEnvironment Environment { get; set; }
    public int ProductCount { get; set; }
    public int CheckoutCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class CouponProductInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? ImageUrl { get; set; }
}

public sealed class CouponCheckoutInfo
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
}

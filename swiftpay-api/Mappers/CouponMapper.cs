using swiftpay_api.Endpoints.Merchants.Coupons;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class CouponMapper
{
    public static CouponData ToData(Coupon coupon)
    {
        return new CouponData
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Name = coupon.Name,
            Description = coupon.Description,
            DiscountType = coupon.DiscountType,
            DiscountFixedAmount = coupon.DiscountFixedAmount,
            DiscountPercentage = coupon.DiscountPercentage,
            MaxDiscountAmount = coupon.MaxDiscountAmount,
            MinOrderAmount = coupon.MinOrderAmount,
            MaxUses = coupon.MaxUses,
            CurrentUses = coupon.CurrentUses,
            MaxUsesPerCustomer = coupon.MaxUsesPerCustomer,
            ValidFrom = coupon.ValidFrom,
            ValidUntil = coupon.ValidUntil,
            Status = coupon.Status,
            ApplyToAllProducts = coupon.ApplyToAllProducts,
            ApplyToAllCheckouts = coupon.ApplyToAllCheckouts,
            Environment = coupon.Environment,
            Products = coupon.Products?.Select(p => new CouponProductInfo
            {
                Id = p.Id,
                Name = p.Name,
                ImageUrl = p.ImageUrl
            }).ToList() ?? [],
            Checkouts = coupon.Checkouts?.Select(c => new CouponCheckoutInfo
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug
            }).ToList() ?? [],
            CreatedAt = coupon.CreatedAt,
            UpdatedAt = coupon.UpdatedAt
        };
    }

    public static MinimalCoupon ToMinimalData(Coupon coupon)
    {
        return new MinimalCoupon
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Name = coupon.Name,
            DiscountType = coupon.DiscountType,
            DiscountFixedAmount = coupon.DiscountFixedAmount,
            DiscountPercentage = coupon.DiscountPercentage,
            MaxDiscountAmount = coupon.MaxDiscountAmount,
            MaxUses = coupon.MaxUses,
            CurrentUses = coupon.CurrentUses,
            ValidFrom = coupon.ValidFrom,
            ValidUntil = coupon.ValidUntil,
            Status = coupon.Status,
            ApplyToAllProducts = coupon.ApplyToAllProducts,
            ApplyToAllCheckouts = coupon.ApplyToAllCheckouts,
            Environment = coupon.Environment,
            ProductCount = coupon.Products?.Count ?? 0,
            CheckoutCount = coupon.Checkouts?.Count ?? 0,
            CreatedAt = coupon.CreatedAt
        };
    }
}

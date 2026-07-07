using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Checkout.ValidateCoupon;

public sealed class ValidateCouponHandler(PrimaryDbContext dbContext)
{
    public async Task<(ValidateCouponResponse response, int statusCode)> HandleAsync(ValidateCouponRequest req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var couponCode = req.CouponCode.Trim().ToUpperInvariant();

        var checkout = await dbContext.Checkouts
            .AsNoTracking()
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts.Where(cp => cp.IsActive))
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        if (checkout.Status != CheckoutStatus.Active)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Checkout não está ativo.", "checkout_inactive")
            }, 400);
        }

        if (!checkout.Config?.CouponEnabled ?? true)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Cupons não estão habilitados neste checkout.", "coupons_disabled")
            }, 400);
        }

        var productIds = checkout.CheckoutProducts
            .Where(cp => cp.IsActive)
            .Select(cp => cp.ProductId)
            .ToList();

        var coupon = await dbContext.Coupons
            .AsNoTracking()
            .Include(c => c.Products)
            .Include(c => c.Checkouts)
            .FirstOrDefaultAsync(c =>
                c.MerchantId == checkout.MerchantId &&
                c.Code.ToUpper() == couponCode &&
                c.Status == CouponStatus.Active, ct);

        if (coupon == null)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Cupom não encontrado.", "coupon_not_found")
            }, 404);
        }

        if (coupon.ValidFrom.HasValue && coupon.ValidFrom.Value > now)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Este cupom ainda não está válido.", "coupon_not_valid_yet")
            }, 400);
        }

        if (coupon.ValidUntil.HasValue && coupon.ValidUntil.Value < now)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Este cupom expirou.", "coupon_expired")
            }, 400);
        }

        if (coupon.MaxUses.HasValue && coupon.CurrentUses >= coupon.MaxUses.Value)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Este cupom atingiu o limite de usos.", "coupon_exhausted")
            }, 400);
        }

        var scope = DetermineScope(coupon, checkout.Id, productIds);

        if (scope == null)
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Este cupom não é válido para este checkout.", "coupon_not_applicable")
            }, 400);
        }

        var applicableProductIds = scope.Value.Scope == CouponScope.Product
            ? GetApplicableProductIds(coupon, productIds)
            : null;

        if (scope.Value.Scope == CouponScope.Product && (applicableProductIds == null || applicableProductIds.Count == 0))
        {
            return (new ValidateCouponResponse
            {
                Error = new ApiErrorResponse("Este cupom não é válido para os produtos deste checkout.", "coupon_not_applicable_products")
            }, 400);
        }

        return (new ValidateCouponResponse
        {
            Data = new ValidateCouponData
            {
                Code = coupon.Code,
                Name = coupon.Name,
                DiscountType = coupon.DiscountType,
                DiscountPercentage = coupon.DiscountPercentage,
                DiscountFixedAmount = coupon.DiscountFixedAmount,
                MinOrderAmount = coupon.MinOrderAmount,
                MaxDiscountAmount = coupon.MaxDiscountAmount,
                Scope = scope.Value.Scope,
                ApplicableProductIds = applicableProductIds
            }
        }, 200);
    }

    private (CouponScope Scope, bool IsValid)? DetermineScope(Coupon coupon, Guid checkoutId, List<Guid> productIds)
    {
        if (coupon.ApplyToAllCheckouts && coupon.ApplyToAllProducts)
        {
            return (CouponScope.Global, true);
        }

        var isCheckoutLinked = !coupon.ApplyToAllCheckouts && coupon.Checkouts.Any(c => c.Id == checkoutId);

        var couponProductIds = coupon.Products.Select(p => p.Id).ToHashSet();
        var hasAnyApplicableProduct = coupon.ApplyToAllProducts || productIds.Any(pid => couponProductIds.Contains(pid));

        if (isCheckoutLinked)
        {
            if (!coupon.ApplyToAllProducts && !hasAnyApplicableProduct)
            {
                return null;
            }
            return (CouponScope.Checkout, true);
        }

        if (coupon.ApplyToAllCheckouts && !coupon.ApplyToAllProducts)
        {
            if (hasAnyApplicableProduct)
            {
                return (CouponScope.Checkout, true);
            }
            return null;
        }

        if (!coupon.ApplyToAllProducts && hasAnyApplicableProduct)
        {
            return (CouponScope.Product, true);
        }

        return null;
    }

    private List<Guid>? GetApplicableProductIds(Coupon coupon, List<Guid> checkoutProductIds)
    {
        if (coupon.ApplyToAllProducts)
            return null;

        var couponProductIds = coupon.Products.Select(p => p.Id).ToHashSet();
        return checkoutProductIds.Where(pid => couponProductIds.Contains(pid)).ToList();
    }
}

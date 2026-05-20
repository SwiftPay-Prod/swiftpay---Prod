using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Calculate;

public sealed class CalculateHandler(PrimaryDbContext dbContext)
{
    public async Task<(CalculateResponse Response, int StatusCode)> HandleAsync(CalculateRequest req, CancellationToken ct)
    {
        var checkout = await dbContext.Checkouts
            .AsNoTracking()
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts.Where(cp => cp.IsActive))
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new CalculateResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        if (checkout.Status != CheckoutStatus.Active)
        {
            return (new CalculateResponse
            {
                Error = new ApiErrorResponse("Checkout não está ativo.", "checkout_inactive")
            }, 400);
        }

        var checkoutProducts = checkout.CheckoutProducts
            .Where(cp => cp.IsActive)
            .ToList();

        var itemsResult = await ResolveItemsAsync(
            checkout.MerchantId,
            checkout.Environment,
            req.Items,
            checkoutProducts,
            ct);

        if (!itemsResult.Success)
        {
            return (new CalculateResponse
            {
                Error = new ApiErrorResponse(itemsResult.ErrorMessage!, itemsResult.ErrorCode)
            }, itemsResult.StatusCode);
        }

        var subtotal = itemsResult.Items!.Sum(i => i.TotalPrice);
        long discount = 0;
        CalculateCouponInfo? couponInfo = null;

        if (!string.IsNullOrWhiteSpace(req.CouponCode) && (checkout.Config?.CouponEnabled ?? false))
        {
            var couponResult = await TryCalculateCouponDiscountAsync(
                checkout,
                req.CouponCode,
                itemsResult.Items!,
                subtotal,
                ct);

            couponInfo = couponResult.CouponInfo;

            if (couponResult.CouponInfo?.IsValid == true)
            {
                discount = couponResult.CouponInfo.DiscountAmount;
            }
        }

        long shipping = 0;

        if (checkout.Config?.ShippingEnabled == true)
        {
            if (!string.IsNullOrWhiteSpace(req.Zipcode))
            {
                shipping = checkout.Config.FixedShippingAmount ?? 0;
            }
            else
            {
                shipping = checkout.Config.FixedShippingAmount ?? 0;
            }
        }

        var total = Math.Max(0, subtotal - discount + shipping);

        return (new CalculateResponse
        {
            Data = new CalculateData
            {
                Subtotal = subtotal,
                Discount = discount,
                Shipping = shipping,
                Total = total,
                Coupon = couponInfo,
                Items = itemsResult.Items!
            }
        }, 200);
    }

    private async Task<ResolveItemsResult> ResolveItemsAsync(
        Guid merchantId,
        ApiEnvironment environment,
        List<CalculateItemInput> items,
        List<CheckoutProduct> checkoutProducts,
        CancellationToken ct)
    {
        var allowedProductIds = checkoutProducts
            .Where(cp => cp.IsActive)
            .Select(cp => cp.ProductId)
            .ToHashSet();

        var requestedProductIds = items.Select(i => i.ProductId).ToHashSet();
        var requestedVariantIds = items
            .Where(i => i.VariantId.HasValue)
            .Select(i => i.VariantId!.Value)
            .ToHashSet();

        foreach (var item in items)
        {
            if (!allowedProductIds.Contains(item.ProductId))
            {
                return ResolveItemsResult.Fail(
                    "Produto não pertence a este checkout.",
                    "product_not_in_checkout",
                    400);
            }
        }

        var products = await dbContext.Products
            .AsNoTracking()
            .Where(p => requestedProductIds.Contains(p.Id) && p.MerchantId == merchantId)
            .ToDictionaryAsync(p => p.Id, ct);

        var variants = requestedVariantIds.Count > 0
            ? await dbContext.Variants
                .AsNoTracking()
                .Where(v => requestedVariantIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, ct)
            : new Dictionary<Guid, Variant>();

        var resolvedItems = new List<CalculateItemInfo>();

        foreach (var item in items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
            {
                return ResolveItemsResult.Fail(
                    "Produto não encontrado.",
                    "product_not_found",
                    400);
            }

            Variant? variant = null;
            if (item.VariantId.HasValue)
            {
                if (!variants.TryGetValue(item.VariantId.Value, out variant) || variant.ProductId != product.Id)
                {
                    return ResolveItemsResult.Fail(
                        "Variante não encontrada.",
                        "variant_not_found",
                        400);
                }
            }

            var checkoutProduct = checkoutProducts.FirstOrDefault(cp =>
                cp.ProductId == item.ProductId &&
                cp.VariantId == item.VariantId);

            var unitPrice = checkoutProduct?.CustomPrice ?? variant?.Price ?? product.Price ?? 0;
            var totalPrice = unitPrice * item.Quantity;

            resolvedItems.Add(new CalculateItemInfo
            {
                ProductId = product.Id,
                VariantId = variant?.Id,
                ProductName = product.Name,
                VariantName = variant?.Name,
                ImageUrl = variant?.ImageUrl ?? product.ImageUrl,
                Quantity = item.Quantity,
                UnitPrice = unitPrice,
                TotalPrice = totalPrice,
                StockQuantity = null,
                IsInStock = true
            });
        }

        return ResolveItemsResult.Ok(resolvedItems);
    }

    private async Task<CouponCalculationResult> TryCalculateCouponDiscountAsync(
        safefy_api_core.Models.Database.Checkout checkout,
        string couponCode,
        List<CalculateItemInfo> items,
        long subtotal,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var code = couponCode.Trim().ToUpperInvariant();

        var coupon = await dbContext.Coupons
            .AsNoTracking()
            .Include(c => c.Products)
            .Include(c => c.Checkouts)
            .FirstOrDefaultAsync(c =>
                c.MerchantId == checkout.MerchantId &&
                c.Code.ToUpper() == code, ct);

        if (coupon == null)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = couponCode,
                IsValid = false,
                ErrorMessage = "Cupom não encontrado."
            });
        }

        if (coupon.Status != CouponStatus.Active)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = coupon.Code,
                IsValid = false,
                ErrorMessage = "Este cupom não está mais ativo."
            });
        }

        if (coupon.ValidFrom.HasValue && coupon.ValidFrom.Value > now)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = coupon.Code,
                IsValid = false,
                ErrorMessage = "Este cupom ainda não está válido."
            });
        }

        if (coupon.ValidUntil.HasValue && coupon.ValidUntil.Value < now)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = coupon.Code,
                IsValid = false,
                ErrorMessage = "Este cupom expirou."
            });
        }

        if (coupon.MaxUses.HasValue && coupon.CurrentUses >= coupon.MaxUses.Value)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = coupon.Code,
                IsValid = false,
                ErrorMessage = "Este cupom atingiu o limite de usos."
            });
        }

        if (coupon.MinOrderAmount.HasValue && subtotal < coupon.MinOrderAmount.Value)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = coupon.Code,
                IsValid = false,
                ErrorMessage = $"Valor mínimo para usar este cupom: R$ {coupon.MinOrderAmount.Value / 100m:N2}."
            });
        }

        var productIds = items.Select(i => i.ProductId).ToHashSet();
        var isCheckoutLinked = !coupon.ApplyToAllCheckouts && coupon.Checkouts.Any(c => c.Id == checkout.Id);
        var couponProductIds = coupon.Products.Select(p => p.Id).ToHashSet();
        var hasAnyApplicableProduct = coupon.ApplyToAllProducts || productIds.Any(pid => couponProductIds.Contains(pid));

        var isApplicable = false;
        long applicableAmount = subtotal;

        if (coupon.ApplyToAllCheckouts && coupon.ApplyToAllProducts)
        {
            isApplicable = true;
            applicableAmount = subtotal;
        }
        else if (isCheckoutLinked)
        {
            if (!coupon.ApplyToAllProducts && !hasAnyApplicableProduct)
            {
                return new CouponCalculationResult(new CalculateCouponInfo
                {
                    Code = coupon.Code,
                    IsValid = false,
                    ErrorMessage = "Este cupom não é válido para os produtos selecionados."
                });
            }
            isApplicable = true;
            applicableAmount = subtotal;
        }
        else if (coupon.ApplyToAllCheckouts && !coupon.ApplyToAllProducts)
        {
            if (hasAnyApplicableProduct)
            {
                isApplicable = true;
                applicableAmount = items
                    .Where(i => couponProductIds.Contains(i.ProductId))
                    .Sum(i => i.TotalPrice);
            }
        }
        else if (!coupon.ApplyToAllProducts && hasAnyApplicableProduct)
        {
            isApplicable = true;
            applicableAmount = items
                .Where(i => couponProductIds.Contains(i.ProductId))
                .Sum(i => i.TotalPrice);
        }

        if (!isApplicable)
        {
            return new CouponCalculationResult(new CalculateCouponInfo
            {
                Code = coupon.Code,
                IsValid = false,
                ErrorMessage = "Este cupom não é válido para este checkout."
            });
        }

        long discountAmount = 0;

        if (coupon.DiscountType == CouponDiscountType.FixedAmount)
        {
            discountAmount = coupon.DiscountFixedAmount ?? 0;
        }
        else if (coupon.DiscountType == CouponDiscountType.Percentage)
        {
            var percentageDecimal = (coupon.DiscountPercentage ?? 0) / 10000m;
            discountAmount = (long)(applicableAmount * percentageDecimal);

            if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
            {
                discountAmount = coupon.MaxDiscountAmount.Value;
            }
        }

        if (discountAmount > subtotal)
        {
            discountAmount = subtotal;
        }

        return new CouponCalculationResult(new CalculateCouponInfo
        {
            Code = coupon.Code,
            IsValid = true,
            DiscountAmount = discountAmount
        });
    }

    private sealed record ResolveItemsResult
    {
        public bool Success { get; init; }
        public List<CalculateItemInfo>? Items { get; init; }
        public string? ErrorMessage { get; init; }
        public string? ErrorCode { get; init; }
        public int StatusCode { get; init; }

        public static ResolveItemsResult Ok(List<CalculateItemInfo> items) => new()
        {
            Success = true,
            Items = items
        };

        public static ResolveItemsResult Fail(string message, string? code, int statusCode) => new()
        {
            Success = false,
            ErrorMessage = message,
            ErrorCode = code,
            StatusCode = statusCode
        };
    }

    private sealed record CouponCalculationResult(CalculateCouponInfo CouponInfo);
}

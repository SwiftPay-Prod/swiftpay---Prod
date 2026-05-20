using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Coupons.UpdateCoupon;

public sealed class UpdateCouponEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateCouponRequest, UpdateCouponResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/coupons/{couponId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateCouponRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateCouponResponse
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
            await Send.ResponseAsync(new UpdateCouponResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var coupon = await dbContext.Coupons
            .Include(c => c.Products)
            .Include(c => c.Checkouts)
            .AsSplitQuery()
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CouponId && c.MerchantId == req.MerchantId, ct);

        if (coupon == null)
        {
            await Send.ResponseAsync(new UpdateCouponResponse
            {
                Error = new("Cupom não encontrado.")
            }, 404, ct);
            return;
        }

        if (req.Name != null) coupon.Name = req.Name;
        if (req.Description != null) coupon.Description = req.Description;
        
        if (req.DiscountType.HasValue)
        {
            coupon.DiscountType = req.DiscountType.Value;
            if (req.DiscountType.Value == CouponDiscountType.FixedAmount)
            {
                coupon.DiscountPercentage = null;
            }
            else
            {
                coupon.DiscountFixedAmount = null;
            }
        }
        
        if (req.DiscountFixedAmount.HasValue) coupon.DiscountFixedAmount = req.DiscountFixedAmount;
        if (req.DiscountPercentage.HasValue) coupon.DiscountPercentage = req.DiscountPercentage;
        if (req.ClearMaxDiscountAmount) coupon.MaxDiscountAmount = null;
        else if (req.MaxDiscountAmount.HasValue) coupon.MaxDiscountAmount = req.MaxDiscountAmount;
        
        if (req.ClearMinOrderAmount) coupon.MinOrderAmount = null;
        else if (req.MinOrderAmount.HasValue) coupon.MinOrderAmount = req.MinOrderAmount;
        
        if (req.ClearMaxUses) coupon.MaxUses = null;
        else if (req.MaxUses.HasValue) coupon.MaxUses = req.MaxUses;
        
        if (req.ClearMaxUsesPerCustomer) coupon.MaxUsesPerCustomer = null;
        else if (req.MaxUsesPerCustomer.HasValue) coupon.MaxUsesPerCustomer = req.MaxUsesPerCustomer;
        
        if (req.ClearValidFrom) coupon.ValidFrom = null;
        else if (req.ValidFrom.HasValue) coupon.ValidFrom = req.ValidFrom;
        
        if (req.ClearValidUntil) coupon.ValidUntil = null;
        else if (req.ValidUntil.HasValue) coupon.ValidUntil = req.ValidUntil;
        if (req.Status.HasValue) coupon.Status = req.Status.Value;
        if (req.ApplyToAllProducts.HasValue) coupon.ApplyToAllProducts = req.ApplyToAllProducts.Value;
        if (req.ApplyToAllCheckouts.HasValue) coupon.ApplyToAllCheckouts = req.ApplyToAllCheckouts.Value;

        if (req.ProductIds != null)
        {
            if (req.ProductIds.Count > 0)
            {
                var products = await dbContext.Products
                    .Where(p => p.MerchantId == req.MerchantId && req.ProductIds.Contains(p.Id))
                    .ToListAsync(ct);

                if (products.Count != req.ProductIds.Count)
                {
                    await Send.ResponseAsync(new UpdateCouponResponse
                    {
                        Error = new("Um ou mais produtos não foram encontrados.")
                    }, 400, ct);
                    return;
                }

                coupon.Products.Clear();
                foreach (var product in products)
                {
                    coupon.Products.Add(product);
                }
            }
            else
            {
                coupon.Products.Clear();
            }
        }

        if (req.CheckoutIds != null)
        {
            if (req.CheckoutIds.Count > 0)
            {
                var checkouts = await dbContext.Checkouts
                    .Where(c => c.MerchantId == req.MerchantId && req.CheckoutIds.Contains(c.Id))
                    .ToListAsync(ct);

                if (checkouts.Count != req.CheckoutIds.Count)
                {
                    await Send.ResponseAsync(new UpdateCouponResponse
                    {
                        Error = new("Um ou mais checkouts não foram encontrados.")
                    }, 400, ct);
                    return;
                }

                coupon.Checkouts.Clear();
                foreach (var checkout in checkouts)
                {
                    coupon.Checkouts.Add(checkout);
                }
            }
            else
            {
                coupon.Checkouts.Clear();
            }
        }

        await dbContext.SaveChangesAsync(ct);

        await dbContext.Entry(coupon).Collection(c => c.Products).LoadAsync(ct);
        await dbContext.Entry(coupon).Collection(c => c.Checkouts).LoadAsync(ct);

        await Send.OkAsync(new UpdateCouponResponse
        {
            Data = CouponMapper.ToData(coupon),
            Message = "Cupom atualizado com sucesso!"
        }, ct);
    }
}

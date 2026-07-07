using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Coupons.CreateCoupon;

public sealed class CreateCouponEndpoint(
    PrimaryDbContext dbContext,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateCouponRequest, CreateCouponResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/coupons");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateCouponRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateCouponResponse
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
            await Send.ResponseAsync(new CreateCouponResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var normalizedCode = req.Code.ToUpperInvariant().Trim();
        
        var existingCoupon = await dbContext.Coupons
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.MerchantId == req.MerchantId && c.Code == normalizedCode, ct);

        if (existingCoupon != null)
        {
            await Send.ResponseAsync(new CreateCouponResponse
            {
                Error = new("Já existe um cupom com este código neste ambiente.")
            }, 400, ct);
            return;
        }

        var products = new List<Product>();
        if (!req.ApplyToAllProducts && req.ProductIds != null && req.ProductIds.Count > 0)
        {
            products = await dbContext.Products
                .Where(p => p.MerchantId == req.MerchantId && req.ProductIds.Contains(p.Id))
                .ToListAsync(ct);

            if (products.Count != req.ProductIds.Count)
            {
                await Send.ResponseAsync(new CreateCouponResponse
                {
                    Error = new("Um ou mais produtos não foram encontrados.")
                }, 400, ct);
                return;
            }
        }

        var checkouts = new List<Checkout>();
        if (!req.ApplyToAllCheckouts && req.CheckoutIds != null && req.CheckoutIds.Count > 0)
        {
            checkouts = await dbContext.Checkouts
                .Where(c => c.MerchantId == req.MerchantId && req.CheckoutIds.Contains(c.Id))
                .ToListAsync(ct);

            if (checkouts.Count != req.CheckoutIds.Count)
            {
                await Send.ResponseAsync(new CreateCouponResponse
                {
                    Error = new("Um ou mais checkouts não foram encontrados.")
                }, 400, ct);
                return;
            }
        }

        var coupon = new Coupon
        {
            Id = Guid.CreateVersion7(),
            MerchantId = req.MerchantId,
            Code = normalizedCode,
            Name = req.Name,
            Description = req.Description,
            DiscountType = req.DiscountType,
            DiscountFixedAmount = req.DiscountType == CouponDiscountType.FixedAmount ? req.DiscountFixedAmount : null,
            DiscountPercentage = req.DiscountType == CouponDiscountType.Percentage ? req.DiscountPercentage : null,
            MaxDiscountAmount = req.MaxDiscountAmount,
            MinOrderAmount = req.MinOrderAmount,
            MaxUses = req.MaxUses,
            CurrentUses = 0,
            MaxUsesPerCustomer = req.MaxUsesPerCustomer,
            ValidFrom = req.ValidFrom,
            ValidUntil = req.ValidUntil,
            Status = CouponStatus.Active,
            ApplyToAllProducts = req.ApplyToAllProducts,
            ApplyToAllCheckouts = req.ApplyToAllCheckouts,
            Environment = environmentProvider.CurrentEnvironment,
            Products = products,
            Checkouts = checkouts
        };

        dbContext.Coupons.Add(coupon);
        await dbContext.SaveChangesAsync(ct);

        await dbContext.Entry(coupon).Collection(c => c.Products).LoadAsync(ct);
        await dbContext.Entry(coupon).Collection(c => c.Checkouts).LoadAsync(ct);

        await Send.CreatedAtAsync<CreateCouponEndpoint>(null, new CreateCouponResponse
        {
            Data = CouponMapper.ToData(coupon),
            Message = "Cupom criado com sucesso!"
        }, cancellation: ct);
    }
}

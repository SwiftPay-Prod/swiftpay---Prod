using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Coupons.ReadCoupon;

public sealed class ReadCouponEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadCouponRequest, ReadCouponResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/coupons/{couponId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadCouponRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadCouponResponse
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
            await Send.ResponseAsync(new ReadCouponResponse
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
            await Send.ResponseAsync(new ReadCouponResponse
            {
                Error = new("Cupom não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadCouponResponse
        {
            Data = CouponMapper.ToData(coupon)
        }, ct);
    }
}

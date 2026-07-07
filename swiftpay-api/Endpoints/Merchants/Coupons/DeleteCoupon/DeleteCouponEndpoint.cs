using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Coupons.DeleteCoupon;

public sealed class DeleteCouponEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<DeleteCouponRequest, DeleteCouponResponse>
{
    public override void Configure()
    {
        Delete("{merchantId:guid}/coupons/{couponId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteCouponRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteCouponResponse
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
            await Send.ResponseAsync(new DeleteCouponResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var coupon = await dbContext.Coupons
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c => c.Id == req.CouponId && c.MerchantId == req.MerchantId, ct);

        if (coupon == null)
        {
            await Send.ResponseAsync(new DeleteCouponResponse
            {
                Error = new("Cupom não encontrado.")
            }, 404, ct);
            return;
        }

        var hasOrders = await dbContext.Orders
            .AnyAsync(o => o.CouponId == req.CouponId, ct);

        if (hasOrders)
        {
            await Send.ResponseAsync(new DeleteCouponResponse
            {
                Error = new("Não é possível excluir um cupom que já foi utilizado em pedidos. Desative-o ao invés disso.")
            }, 400, ct);
            return;
        }

        dbContext.Coupons.Remove(coupon);
        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new DeleteCouponResponse
        {
            Message = "Cupom excluído com sucesso!"
        }, ct);
    }
}

using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Enum;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.Orders.ReadOrder;

public sealed class ReadOrderEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadOrderRequest, ReadOrderResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/orders/{orderId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadOrderRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadOrderResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadOrderResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadOrderResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .Include(o => o.Coupon)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .OrderBy(o => o.Id)
            .FirstOrDefaultAsync(o => o.Id == req.OrderId && o.MerchantId == req.MerchantId, ct);

        if (order == null)
        {
            await Send.ResponseAsync(new ReadOrderResponse
            {
                Error = new("Pedido não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.ResponseAsync(new ReadOrderResponse
        {
            Data = OrderMapper.ToDetails(order)
        }, cancellation: ct);
    }
}

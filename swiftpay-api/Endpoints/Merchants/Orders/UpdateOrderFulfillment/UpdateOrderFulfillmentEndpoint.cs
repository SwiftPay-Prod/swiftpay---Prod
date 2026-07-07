using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Orders.UpdateOrderFulfillment;

public sealed class UpdateOrderFulfillmentEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateOrderFulfillmentRequest, UpdateOrderFulfillmentResponse>
{
    public override void Configure()
    {
        Patch("{merchantId:guid}/orders/{orderId:guid}/fulfillment");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(UpdateOrderFulfillmentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateOrderFulfillmentResponse
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
            await Send.ResponseAsync(new UpdateOrderFulfillmentResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new UpdateOrderFulfillmentResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var order = await dbContext.Orders
            .OrderBy(o => o.Id)
            .FirstOrDefaultAsync(o => o.Id == req.OrderId && o.MerchantId == req.MerchantId, ct);

        if (order == null)
        {
            await Send.ResponseAsync(new UpdateOrderFulfillmentResponse
            {
                Error = new("Pedido não encontrado.")
            }, 404, ct);
            return;
        }

        if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Refunded)
        {
            await Send.ResponseAsync(new UpdateOrderFulfillmentResponse
            {
                Error = new("Não é possível atualizar pedidos cancelados ou estornados.")
            }, 400, ct);
            return;
        }

        order.FulfillmentStatus = req.FulfillmentStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new UpdateOrderFulfillmentResponse
        {
            Data = new UpdateOrderFulfillmentData
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber ?? string.Empty,
                Status = order.Status,
                FulfillmentStatus = order.FulfillmentStatus,
                UpdatedAt = order.UpdatedAt
            },
            Message = "Status de entrega atualizado com sucesso."
        }, cancellation: ct);
    }
}

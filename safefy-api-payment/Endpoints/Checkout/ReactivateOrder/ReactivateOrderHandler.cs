using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.ReactivateOrder;

public sealed class ReactivateOrderHandler(
    PrimaryDbContext dbContext,
    IStockService stockService
)
{
    private const int ReservationBackendBufferMinutes = 5;

    public async Task<(ReactivateOrderResponse response, int statusCode)> HandleAsync(
        ReactivateOrderRequest req,
        CancellationToken ct)
    {
        var checkout = await dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        if (checkout.Status != CheckoutStatus.Active)
        {
            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse("Este checkout não está mais disponível.", "checkout_inactive")
            }, 410);
        }

        var now = DateTime.UtcNow;
        var config = checkout.Config;
        if (config == null)
        {
            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse("Configuração do checkout incompleta.", "checkout_invalid_config")
            }, 400);
        }

        var order = await dbContext.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .Include(o => o.Items)
                .ThenInclude(i => i.Variant)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == req.OrderId && o.CheckoutId == checkout.Id, ct);

        if (order == null)
        {
            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse("Pedido não encontrado.", "order_not_found")
            }, 404);
        }

        if (order.Status != OrderStatus.Expired)
        {
            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse("O pedido não está expirado.", "order_not_expired")
            }, 400);
        }

        var itemsWithStock = new List<(OrderItem item, int? availableStock, bool isInStock)>();
        var hasInsufficientStock = false;

        foreach (var item in order.Items)
        {
            var validation = await stockService.ValidateAvailabilityAsync(
                item.ProductId,
                item.VariantId,
                item.Quantity,
                order.Id,
                ct);

            var availableStock = await stockService.GetAvailableStockAsync(
                item.ProductId,
                item.VariantId,
                order.Id,
                ct);

            itemsWithStock.Add((item, availableStock, validation.IsValid));

            if (!validation.IsValid)
            {
                hasInsufficientStock = true;
            }
        }

        if (hasInsufficientStock)
        {
            var outOfStockItems = itemsWithStock
                .Where(x => !x.isInStock)
                .Select(x => x.item.VariantName ?? x.item.ProductName)
                .ToList();

            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse(
                    $"Estoque insuficiente para: {string.Join(", ", outOfStockItems)}",
                    "insufficient_stock")
            }, 400);
        }

        var reservationMinutes = config.ReservationExpirationMinutes;
        var reservationMinutesBackend = reservationMinutes + ReservationBackendBufferMinutes;

        order.Status = OrderStatus.Reserved;
        order.ReservedAt = now;
        order.ExpiresAt = now.AddMinutes(reservationMinutesBackend);
        order.DisplayExpiresAt = now.AddMinutes(reservationMinutes);
        order.UpdatedAt = now;

        var reservationResult = await stockService.ReserveForOrderAsync(order, ct);
        if (!reservationResult.Success)
        {
            return (new ReactivateOrderResponse
            {
                Error = new ApiErrorResponse(reservationResult.ErrorMessage ?? "Erro ao reservar estoque.", "stock_reservation_failed")
            }, 400);
        }

        await dbContext.SaveChangesAsync(ct);

        var responseItems = new List<ReactivateOrderItemData>();
        foreach (var (item, availableStock, isInStock) in itemsWithStock)
        {
            responseItems.Add(new ReactivateOrderItemData
            {
                ProductId = item.ProductId,
                VariantId = item.VariantId,
                ProductName = item.ProductName,
                VariantName = item.VariantName,
                Sku = item.Sku,
                ImageUrl = item.ImageUrl,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.TotalPrice,
                AvailableStock = availableStock,
                IsInStock = isInStock
            });
        }

        var data = new ReactivateOrderData
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            Status = order.Status,
            SubtotalAmount = order.SubtotalAmount,
            DiscountAmount = order.DiscountAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            ReservedAt = order.ReservedAt ?? now,
            ExpiresAt = order.ExpiresAt ?? now.AddMinutes(reservationMinutesBackend),
            DisplayExpiresAt = order.DisplayExpiresAt ?? now.AddMinutes(reservationMinutes),
            Items = responseItems
        };

        if (order.Customer != null)
        {
            data.Customer = new ReactivateOrderCustomerData
            {
                Id = order.Customer.Id,
                Name = order.Customer.Name,
                Email = order.Customer.Email,
                Phone = order.Customer.Phone,
                Document = order.Customer.Document
            };
        }

        return (new ReactivateOrderResponse 
        { 
            Data = data,
            Message = "Pedido reativado com sucesso."
        }, 200);
    }
}

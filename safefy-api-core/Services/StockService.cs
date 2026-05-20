using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Services;

public class StockService(PrimaryDbContext dbContext) : IStockService
{
    public async Task<StockValidationResult> ValidateAvailabilityAsync(
        Guid productId,
        Guid? variantId,
        int requestedQuantity,
        Guid? excludeOrderId = null,
        CancellationToken ct = default)
    {
        if (requestedQuantity <= 0)
            return StockValidationResult.Failed("Quantidade deve ser maior que zero.");

        int? totalStock;
        if (variantId.HasValue)
        {
            var variant = await dbContext.Variants
                .FirstOrDefaultAsync(v => v.Id == variantId.Value && v.ProductId == productId, ct);

            if (variant == null)
                return StockValidationResult.ProductNotFound();

            totalStock = variant.StockQuantity;
        }
        else
        {
            var product = await dbContext.Products
                .FirstOrDefaultAsync(p => p.Id == productId, ct);

            if (product == null)
                return StockValidationResult.ProductNotFound();

            totalStock = product.StockQuantity;
        }

        if (totalStock == null)
            return StockValidationResult.InfiniteStock(requestedQuantity);

        var reservedQuery = dbContext.Orders
            .Where(o => o.Status == OrderStatus.Reserved)
            .Where(o => o.ExpiresAt > DateTime.UtcNow)
            .SelectMany(o => o.Items)
            .Where(oi => oi.ProductId == productId);

        if (variantId.HasValue)
            reservedQuery = reservedQuery.Where(oi => oi.VariantId == variantId);

        if (excludeOrderId.HasValue)
            reservedQuery = dbContext.Orders
                .Where(o => o.Status == OrderStatus.Reserved)
                .Where(o => o.ExpiresAt > DateTime.UtcNow)
                .Where(o => o.Id != excludeOrderId.Value)
                .SelectMany(o => o.Items)
                .Where(oi => oi.ProductId == productId);

        var reserved = await reservedQuery.SumAsync(oi => oi.Quantity, ct);
        var available = totalStock.Value - reserved;

        if (available < requestedQuantity)
            return StockValidationResult.InsufficientStock(available, requestedQuantity);

        return StockValidationResult.Success(available, requestedQuantity);
    }

    public async Task<StockReservationResult> ReserveForOrderAsync(
        Order order,
        CancellationToken ct = default)
    {
        var items = order.Items;
        if (items == null || items.Count == 0)
            return StockReservationResult.Failed("O pedido não possui itens.");

        var results = new List<StockReservationItemResult>();

        foreach (var item in items)
        {
            var validation = await ValidateAvailabilityAsync(
                item.ProductId,
                item.VariantId,
                item.Quantity,
                order.Id,
                ct);

            if (!validation.IsValid)
                return StockReservationResult.Failed(
                    $"Estoque insuficiente para o produto {item.ProductName}: {validation.ErrorMessage}");

            int? balanceBefore = validation.AvailableStock;
            int? balanceAfter = balanceBefore.HasValue ? balanceBefore.Value - item.Quantity : null;

            if (balanceBefore.HasValue)
            {
                var movement = new StockMovement
                {
                    Id = Guid.CreateVersion7(),
                    MerchantId = order.MerchantId,
                    ProductId = item.ProductId,
                    VariantId = item.VariantId,
                    Type = StockMovementType.Reserved,
                    Quantity = item.Quantity,
                    ReferenceType = StockMovementReferenceType.Order,
                    ReferenceId = order.Id,
                    BalanceBefore = balanceBefore.Value,
                    BalanceAfter = balanceAfter ?? 0,
                    Notes = $"Reserva para pedido #{order.OrderNumber}",
                    Environment = order.Environment,
                    CreatedAt = DateTime.UtcNow
                };
                dbContext.StockMovements.Add(movement);
            }

            results.Add(new StockReservationItemResult
            {
                ProductId = item.ProductId,
                VariantId = item.VariantId,
                Quantity = item.Quantity,
                AvailableBefore = balanceBefore,
                AvailableAfter = balanceAfter
            });
        }

        await dbContext.SaveChangesAsync(ct);
        return StockReservationResult.Succeeded(results);
    }

    public async Task<bool> ConfirmReservationAsync(
        Guid orderId,
        CancellationToken ct = default)
    {
        var order = await dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            return false;

        foreach (var item in order.Items)
        {
            int? currentStock;
            if (item.VariantId.HasValue)
            {
                var variant = await dbContext.Variants
                    .FirstOrDefaultAsync(v => v.Id == item.VariantId, ct);

                if (variant?.StockQuantity == null)
                    continue;

                currentStock = variant.StockQuantity.Value;
                variant.StockQuantity = currentStock - item.Quantity;
            }
            else
            {
                var product = await dbContext.Products
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId, ct);

                if (product?.StockQuantity == null)
                    continue;

                currentStock = product.StockQuantity.Value;
                product.StockQuantity = currentStock - item.Quantity;
            }

            var movement = new StockMovement
            {
                Id = Guid.CreateVersion7(),
                MerchantId = order.MerchantId,
                ProductId = item.ProductId,
                VariantId = item.VariantId,
                Type = StockMovementType.Confirmed,
                Quantity = item.Quantity,
                ReferenceType = StockMovementReferenceType.Order,
                ReferenceId = orderId,
                BalanceBefore = currentStock.Value,
                BalanceAfter = currentStock.Value - item.Quantity,
                Notes = $"Confirmação de pedido #{order.OrderNumber}",
                Environment = order.Environment,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.StockMovements.Add(movement);
        }

        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ReleaseReservationAsync(
        Guid orderId,
        string? notes = null,
        CancellationToken ct = default)
    {
        var order = await dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            return false;

        foreach (var item in order.Items)
        {
            int? currentStock;
            if (item.VariantId.HasValue)
            {
                var variant = await dbContext.Variants
                    .FirstOrDefaultAsync(v => v.Id == item.VariantId, ct);

                currentStock = variant?.StockQuantity;
            }
            else
            {
                var product = await dbContext.Products
                    .FirstOrDefaultAsync(p => p.Id == item.ProductId, ct);

                currentStock = product?.StockQuantity;
            }

            if (currentStock == null)
                continue;

            var movement = new StockMovement
            {
                Id = Guid.CreateVersion7(),
                MerchantId = order.MerchantId,
                ProductId = item.ProductId,
                VariantId = item.VariantId,
                Type = StockMovementType.Released,
                Quantity = item.Quantity,
                ReferenceType = StockMovementReferenceType.Order,
                ReferenceId = orderId,
                BalanceBefore = currentStock.Value,
                BalanceAfter = currentStock.Value,
                Notes = notes ?? $"Liberação de reserva do pedido #{order.OrderNumber}",
                Environment = order.Environment,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.StockMovements.Add(movement);
        }

        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int?> GetAvailableStockAsync(
        Guid productId,
        Guid? variantId,
        Guid? excludeOrderId = null,
        CancellationToken ct = default)
    {
        int? totalStock;
        if (variantId.HasValue)
        {
            var variant = await dbContext.Variants
                .FirstOrDefaultAsync(v => v.Id == variantId.Value && v.ProductId == productId, ct);

            totalStock = variant?.StockQuantity;
        }
        else
        {
            var product = await dbContext.Products
                .FirstOrDefaultAsync(p => p.Id == productId, ct);

            totalStock = product?.StockQuantity;
        }

        if (totalStock == null)
            return null;

        var reservedQuery = dbContext.Orders
            .Where(o => o.Status == OrderStatus.Reserved)
            .Where(o => o.ExpiresAt > DateTime.UtcNow)
            .SelectMany(o => o.Items)
            .Where(oi => oi.ProductId == productId);

        if (variantId.HasValue)
            reservedQuery = reservedQuery.Where(oi => oi.VariantId == variantId);

        if (excludeOrderId.HasValue)
        {
            reservedQuery = dbContext.Orders
                .Where(o => o.Status == OrderStatus.Reserved)
                .Where(o => o.ExpiresAt > DateTime.UtcNow)
                .Where(o => o.Id != excludeOrderId.Value)
                .SelectMany(o => o.Items)
                .Where(oi => oi.ProductId == productId);

            if (variantId.HasValue)
                reservedQuery = reservedQuery.Where(oi => oi.VariantId == variantId);
        }

        var reserved = await reservedQuery.SumAsync(oi => oi.Quantity, ct);
        return totalStock.Value - reserved;
    }

    public async Task<StockInfo> GetStockInfoAsync(
        Guid productId,
        Guid? variantId,
        int requestedQuantity,
        Guid? excludeOrderId = null,
        CancellationToken ct = default)
    {
        var product = await dbContext.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId, ct);

        if (product == null)
            return StockInfo.NotFound();

        if (product.IsUnlimitedDigitalStock)
        {
            if (product.Type == ProductType.Digital)
            {
                var hasDigitalItem = await dbContext.DigitalItems
                    .AsNoTracking()
                    .AnyAsync(di =>
                        di.ProductId == productId &&
                        (di.VariantId == null || di.VariantId == variantId), ct);

                return hasDigitalItem
                    ? StockInfo.ForUnlimited(true)
                    : StockInfo.ForDigital(0, requestedQuantity);
            }

            return StockInfo.ForUnlimited(false);
        }

        if (product.Type == ProductType.Digital)
        {
            var digitalItemsCount = await dbContext.DigitalItems
                .AsNoTracking()
                .CountAsync(di =>
                    di.ProductId == productId &&
                    (di.VariantId == null || di.VariantId == variantId) &&
                    di.Status == DigitalItemStatus.Available, ct);

            return StockInfo.ForDigital(digitalItemsCount, requestedQuantity);
        }

        int? stockQuantity;
        if (variantId.HasValue)
        {
            var variant = await dbContext.Variants
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == variantId.Value && v.ProductId == productId, ct);

            stockQuantity = variant?.StockQuantity ?? product.StockQuantity;
        }
        else
        {
            stockQuantity = product.StockQuantity;
        }

        return StockInfo.ForPhysical(stockQuantity, requestedQuantity);
    }

    public async Task<bool> ReserveDigitalItemsAsync(
        Order order,
        CancellationToken ct = default)
    {
        var items = order.Items;
        if (items == null || items.Count == 0)
            return true;

        foreach (var item in items)
        {
            var product = await dbContext.Products
                .FirstOrDefaultAsync(p => p.Id == item.ProductId, ct);

            if (product == null || product.Type != ProductType.Digital)
                continue;

            if (product.IsUnlimitedDigitalStock)
            {
                var hasDigitalItem = await dbContext.DigitalItems
                    .AnyAsync(di =>
                        di.ProductId == item.ProductId &&
                        (di.VariantId == null || di.VariantId == item.VariantId), ct);

                if (!hasDigitalItem)
                    return false;

                continue;
            }

            var digitalItems = await dbContext.DigitalItems
                .Where(di => di.ProductId == item.ProductId)
                .Where(di => di.VariantId == null || di.VariantId == item.VariantId)
                .Where(di => di.Status == DigitalItemStatus.Available)
                .OrderBy(di => di.VariantId == item.VariantId ? 0 : 1)
                .ThenBy(di => di.CreatedAt)
                .Take(item.Quantity)
                .ToListAsync(ct);

            if (digitalItems.Count < item.Quantity)
                return false;

            foreach (var digitalItem in digitalItems)
            {
                digitalItem.Status = DigitalItemStatus.Reserved;
                digitalItem.ReservedAt = DateTime.UtcNow;
                digitalItem.ReservedForOrderId = order.Id;
                digitalItem.ReservedForOrderItemId = item.Id;
            }
        }

        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ConfirmDigitalItemsAsync(
        Guid orderId,
        CancellationToken ct = default)
    {
        var order = await dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);

        if (order == null)
            return false;

        var digitalItems = await dbContext.DigitalItems
            .Where(di => di.ReservedForOrderId == orderId)
            .Where(di => di.Status == DigitalItemStatus.Reserved)
            .ToListAsync(ct);

        foreach (var digitalItem in digitalItems)
        {
            digitalItem.Status = DigitalItemStatus.Delivered;
            digitalItem.DeliveredAt = DateTime.UtcNow;
            digitalItem.DeliveredToOrderId = orderId;

            var orderItem = order.Items.FirstOrDefault(oi => oi.Id == digitalItem.ReservedForOrderItemId);
            if (orderItem != null)
                digitalItem.DeliveredToOrderItemId = orderItem.Id;
        }

        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ReleaseDigitalItemsAsync(
        Guid orderId,
        CancellationToken ct = default)
    {
        var digitalItems = await dbContext.DigitalItems
            .Where(di => di.ReservedForOrderId == orderId)
            .Where(di => di.Status == DigitalItemStatus.Reserved)
            .ToListAsync(ct);

        foreach (var digitalItem in digitalItems)
        {
            digitalItem.Status = DigitalItemStatus.Available;
            digitalItem.ReservedAt = null;
            digitalItem.ReservedForOrderId = null;
            digitalItem.ReservedForOrderItemId = null;
        }

        await dbContext.SaveChangesAsync(ct);
        return true;
    }
}

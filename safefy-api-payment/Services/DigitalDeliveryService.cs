using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_payment.Services;

public sealed class DigitalDeliveryService(
    PrimaryDbContext dbContext,
    IEmailTemplateService emailTemplateService
) : IDigitalDeliveryService
{
    public async Task<DigitalDeliveryResult> ProcessDeliveryAsync(
        Guid paymentId,
        Guid merchantId,
        Guid? orderId,
        string? customerEmail,
        string? customerName,
        string environment,
        CancellationToken ct = default)
    {
        var result = new DigitalDeliveryResult();

        if (string.IsNullOrWhiteSpace(customerEmail))
        {
            result.ErrorMessage = "No customer email provided for digital delivery.";
            return result;
        }

        var payment = await dbContext.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
                    .ThenInclude(oi => oi.Product)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
                    .ThenInclude(oi => oi.DeliveredDigitalItems)
            .Include(p => p.Merchant)
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

        if (payment == null)
        {
            result.ErrorMessage = "Payment not found.";
            return result;
        }

        if (payment.Order == null || payment.Order.Items.Count == 0)
        {
            result.Success = true;
            return result;
        }

        var digitalProducts = payment.Order.Items
            .Where(oi => oi.Product?.Type == ProductType.Digital)
            .ToList();

        if (digitalProducts.Count == 0)
        {
            result.Success = true;
            return result;
        }

        var deliveredItems = new List<(OrderItem orderItem, List<DigitalItem> items)>();

        foreach (var orderItem in digitalProducts)
        {
            if (orderItem.Product == null) continue;

            var isUnlimitedStock = orderItem.Product.IsUnlimitedDigitalStock;

            var alreadyDelivered = orderItem.DeliveredDigitalItems?.Count ?? 0;
            var quantityToDeliver = isUnlimitedStock
                ? alreadyDelivered > 0 ? 0 : 1
                : orderItem.Quantity - alreadyDelivered;

            if (quantityToDeliver <= 0) continue;

            if (isUnlimitedStock)
            {
                var unlimitedItem = await dbContext.DigitalItems
                    .Where(di => di.ProductId == orderItem.ProductId)
                    .Where(di => orderItem.VariantId == null || di.VariantId == orderItem.VariantId)
                    .OrderBy(di => di.CreatedAt)
                    .FirstOrDefaultAsync(ct);

                if (unlimitedItem == null)
                {
                    result.ProductsWithNoStock.Add(orderItem.ProductName);
                    continue;
                }

                deliveredItems.Add((orderItem, new List<DigitalItem> { unlimitedItem }));
                result.ItemsDelivered += 1;
                continue;
            }

            var reservedItems = await dbContext.DigitalItems
                .Where(di => di.ReservedForOrderId == payment.OrderId)
                .Where(di => di.ReservedForOrderItemId == orderItem.Id)
                .Where(di => di.Status == DigitalItemStatus.Reserved)
                .ToListAsync(ct);

            var availableItems = reservedItems.Count > 0
                ? reservedItems
                : await dbContext.DigitalItems
                    .Where(di => di.ProductId == orderItem.ProductId)
                    .Where(di => orderItem.VariantId == null || di.VariantId == orderItem.VariantId)
                    .Where(di => di.Status == DigitalItemStatus.Available)
                    .OrderBy(di => di.CreatedAt)
                    .Take(quantityToDeliver)
                    .ToListAsync(ct);

            if (availableItems.Count < quantityToDeliver)
            {
                result.ProductsWithNoStock.Add(orderItem.ProductName);
            }

            if (availableItems.Count == 0) continue;

            var now = DateTime.UtcNow;
            foreach (var item in availableItems)
            {
                item.Status = DigitalItemStatus.Delivered;
                item.DeliveredAt = now;
                item.DeliveredToOrderId = payment.OrderId;
                item.DeliveredToOrderItemId = orderItem.Id;
                item.UpdatedAt = now;

                orderItem.DeliveredDigitalItems ??= [];
                orderItem.DeliveredDigitalItems.Add(item);
            }

            deliveredItems.Add((orderItem, availableItems));
            result.ItemsDelivered += availableItems.Count;
        }

        await dbContext.SaveChangesAsync(ct);

        if (deliveredItems.Count > 0)
        {
            var emailSent = await SendDeliveryEmailAsync(
                payment,
                customerEmail,
                customerName,
                deliveredItems,
                ct);

            result.EmailSent = emailSent;
        }

        result.Success = true;
        return result;
    }

    public async Task<IReadOnlyList<DigitalItem>> GetDeliveredItemsAsync(
        Guid orderItemId,
        CancellationToken ct = default)
    {
        var deliveredItems = await dbContext.DigitalItems
            .Where(di => di.DeliveredToOrderItemId == orderItemId)
            .OrderBy(di => di.DeliveredAt)
            .ToListAsync(ct);

        if (deliveredItems.Count > 0)
            return deliveredItems;

        var orderItem = await dbContext.OrderItems
            .Include(oi => oi.Product)
            .FirstOrDefaultAsync(oi => oi.Id == orderItemId, ct);

        if (orderItem?.Product?.Type != ProductType.Digital || !orderItem.Product.IsUnlimitedDigitalStock)
            return deliveredItems;

        var unlimitedItem = await dbContext.DigitalItems
            .Where(di => di.ProductId == orderItem.ProductId)
            .Where(di => orderItem.VariantId == null || di.VariantId == orderItem.VariantId)
            .OrderBy(di => di.CreatedAt)
            .FirstOrDefaultAsync(ct);

        return unlimitedItem == null
            ? deliveredItems
            : new List<DigitalItem> { unlimitedItem };
    }

    public async Task<bool> ResendDeliveryEmailAsync(
        Guid paymentId,
        CancellationToken ct = default)
    {
        var payment = await dbContext.Payments
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
                    .ThenInclude(oi => oi.Product)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
                    .ThenInclude(oi => oi.DeliveredDigitalItems)
            .Include(p => p.Customer)
            .Include(p => p.Merchant)
            .FirstOrDefaultAsync(p => p.Id == paymentId, ct);

        if (payment?.Order == null || payment.Customer == null)
            return false;

        var deliveredItems = payment.Order.Items
            .Where(oi => oi.DeliveredDigitalItems?.Count > 0)
            .Select(oi => (oi, oi.DeliveredDigitalItems!.ToList()))
            .ToList();

        if (deliveredItems.Count == 0)
        {
            foreach (var orderItem in payment.Order.Items)
            {
                if (orderItem.Product?.Type != ProductType.Digital || !orderItem.Product.IsUnlimitedDigitalStock)
                    continue;

                var unlimitedItem = await dbContext.DigitalItems
                    .Where(di => di.ProductId == orderItem.ProductId)
                    .Where(di => orderItem.VariantId == null || di.VariantId == orderItem.VariantId)
                    .OrderBy(di => di.CreatedAt)
                    .FirstOrDefaultAsync(ct);

                if (unlimitedItem == null)
                    continue;

                deliveredItems.Add((orderItem, new List<DigitalItem> { unlimitedItem }));
            }
        }

        if (deliveredItems.Count == 0)
            return false;

        return await SendDeliveryEmailAsync(
            payment,
            payment.Customer.Email,
            payment.Customer.Name,
            deliveredItems,
            ct);
    }

    private async Task<bool> SendDeliveryEmailAsync(
        Payment payment,
        string customerEmail,
        string? customerName,
        List<(OrderItem orderItem, List<DigitalItem> items)> deliveredItems,
        CancellationToken ct)
    {
        var digitalItems = deliveredItems.Select(d => new DigitalDeliveryItem
        {
            ProductName = d.orderItem.ProductName,
            VariantName = d.orderItem.VariantName,
            Quantity = d.orderItem.Quantity,
            UnitPrice = d.orderItem.UnitPrice,
            TotalPrice = d.orderItem.TotalPrice,
            ImageUrl = d.orderItem.ImageUrl,
            Items = d.items.Select(i => new DigitalItemContent
            {
                Label = i.Label,
                Content = i.Content
            }).ToList()
        }).ToList();

        var context = new EmailTemplateContext
        {
            MerchantId = payment.MerchantId,
            Environment = payment.Environment,
            CustomerName = customerName,
            CustomerEmail = customerEmail,
            OrderNumber = payment.Order?.OrderNumber ?? $"#{payment.Id.ToString()[..8]}",
            MerchantName = payment.Merchant?.Name,
            MerchantLogoUrl = null,
            DigitalItems = digitalItems
        };

        var sendResult = await emailTemplateService.SendAsync(
            MerchantEmailTemplateType.DigitalDelivery,
            context,
            ct);
        return sendResult.Success;
    }
}

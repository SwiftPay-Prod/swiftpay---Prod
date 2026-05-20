using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.ReserveOrder;

public sealed class ReserveOrderHandler(
    PrimaryDbContext dbContext,
    IStockService stockService
)
{
    private const int ReservationBackendBufferMinutes = 5;

    public async Task<(ReserveOrderResponse response, int statusCode)> HandleAsync(
        ReserveOrderRequest req,
        CancellationToken ct)
    {
        var checkout = await dbContext.Checkouts
            .Include(c => c.CheckoutTemplate)
            .Include(c => c.Config)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(p => p.Product)
                    .ThenInclude(p => p!.Variants)
            .Include(c => c.CheckoutProducts)
                .ThenInclude(p => p.Variant)
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new ReserveOrderResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        if (checkout.Status != CheckoutStatus.Active)
        {
            return (new ReserveOrderResponse
            {
                Error = new ApiErrorResponse("Este checkout não está mais disponível.", "checkout_inactive")
            }, 410);
        }

        var now = DateTime.UtcNow;
        var template = checkout.CheckoutTemplate;
        var config = checkout.Config;

        if (template == null || config == null)
        {
            return (new ReserveOrderResponse
            {
                Error = new ApiErrorResponse("Configuração do checkout incompleta.", "checkout_invalid_config")
            }, 400);
        }

        var customerId = await GetOrCreateCustomerAsync(
            checkout.MerchantId,
            checkout.Environment,
            req.Customer,
            ct);

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == customerId, ct);

        var existingOrder = await FindExistingReservationAsync(
            checkout.MerchantId,
            customerId,
            checkout.Id,
            req.SessionId,
            ct);

        List<(Guid productId, Guid? variantId, int quantity, Product product, Variant? variant)> items;

        if (template.Type == CheckoutTemplateType.SingleOrder)
        {
            items = checkout.CheckoutProducts
                .Where(cp => cp.Product != null)
                .Select(cp => (cp.ProductId, cp.VariantId, cp.Quantity, cp.Product!, cp.Variant))
                .ToList();
        }
        else
        {
            if (req.Items == null || req.Items.Count == 0)
            {
                return (new ReserveOrderResponse
                {
                    Error = new ApiErrorResponse("Os itens são obrigatórios para este tipo de checkout.", "items_required")
                }, 400);
            }

            var availableProducts = checkout.CheckoutProducts.ToDictionary(cp => (cp.ProductId, cp.VariantId));
            items = [];

            foreach (var item in req.Items)
            {
                if (!availableProducts.TryGetValue((item.ProductId, item.VariantId), out var cp) || cp.Product == null)
                {
                    return (new ReserveOrderResponse
                    {
                        Error = new ApiErrorResponse("Um ou mais produtos não estão disponíveis neste checkout.", "invalid_products")
                    }, 400);
                }

                items.Add((item.ProductId, item.VariantId, item.Quantity, cp.Product, cp.Variant));
            }
        }

        var itemsWithStockInfo = new List<(Guid productId, Guid? variantId, int quantity, Product product, Variant? variant, bool isInStock, int? availableStock)>();

        foreach (var (productId, variantId, quantity, product, variant) in items)
        {
            var validation = await stockService.ValidateAvailabilityAsync(
                productId,
                variantId,
                quantity,
                existingOrder?.Id,
                ct);

            itemsWithStockInfo.Add((productId, variantId, quantity, product, variant, validation.IsValid, validation.AvailableStock));
        }

        var reservationMinutes = config.ReservationExpirationMinutes;
        var reservationMinutesBackend = reservationMinutes + ReservationBackendBufferMinutes;

        Order order;

        if (existingOrder != null)
        {
            order = existingOrder;
            await stockService.ReleaseReservationAsync(order.Id, "Atualização de reserva", ct);
            await stockService.ReleaseDigitalItemsAsync(order.Id, ct);

            dbContext.OrderItems.RemoveRange(order.Items);

            order.CustomerId = customerId;
            order.UpdatedAt = now;
            order.ReservedAt = now;
            order.ExpiresAt = now.AddMinutes(reservationMinutesBackend);
            order.DisplayExpiresAt = now.AddMinutes(reservationMinutes);
        }
        else
        {
            var orderNumber = await GenerateOrderNumberAsync(checkout.MerchantId, ct);

            order = new Order
            {
                Id = Guid.CreateVersion7(),
                MerchantId = checkout.MerchantId,
                CustomerId = customerId,
                CheckoutId = checkout.Id,
                Environment = checkout.Environment,
                Status = OrderStatus.Reserved,
                FulfillmentStatus = OrderFulfillmentStatus.Unfulfilled,
                SessionId = req.SessionId,
                ReservedAt = now,
                ExpiresAt = now.AddMinutes(reservationMinutesBackend),
                DisplayExpiresAt = now.AddMinutes(reservationMinutes),
                OrderNumber = orderNumber,
                CreatedAt = now,
                UpdatedAt = now
            };

            dbContext.Orders.Add(order);
        }

        long subtotal = 0;
        var orderItems = new List<OrderItem>();

        foreach (var (productId, variantId, quantity, product, variant, _, _) in itemsWithStockInfo)
        {
            var price = variant?.Price ?? product.Price ?? 0;
            var totalPrice = price * quantity;
            subtotal += totalPrice;

            var orderItem = new OrderItem
            {
                Id = Guid.CreateVersion7(),
                OrderId = order.Id,
                ProductId = productId,
                VariantId = variantId,
                ProductName = product.Name,
                VariantName = variant?.Name,
                Sku = variant?.SKU,
                ImageUrl = variant?.ImageUrl ?? product.ImageUrls?.FirstOrDefault() ?? product.ImageUrl,
                Quantity = quantity,
                UnitPrice = price,
                TotalPrice = totalPrice,
                CreatedAt = now
            };

            orderItems.Add(orderItem);
            dbContext.OrderItems.Add(orderItem);
        }

        var shippingAmount = config.ShippingEnabled && config.FixedShippingAmount.HasValue
            ? config.FixedShippingAmount.Value
            : 0L;

        order.SubtotalAmount = subtotal;
        order.DiscountAmount = 0;
        order.ShippingAmount = shippingAmount;
        order.TotalAmount = subtotal + shippingAmount;
        order.CouponCode = req.CouponCode?.Trim().ToUpperInvariant();

        var hasAllItemsInStock = itemsWithStockInfo.All(i => i.isInStock);
        if (hasAllItemsInStock)
        {
            var reservationResult = await stockService.ReserveForOrderAsync(order, ct);
            if (!reservationResult.Success)
            {
                return (new ReserveOrderResponse
                {
                    Error = new ApiErrorResponse(reservationResult.ErrorMessage ?? "Erro ao reservar estoque.", "stock_reservation_failed")
                }, 400);
            }
        }

        var responseItems = new List<ReserveOrderItemData>();
        foreach (var (productId, variantId, quantity, _, _, isInStock, availableStock) in itemsWithStockInfo)
        {
            var orderItem = orderItems.First(oi => oi.ProductId == productId && oi.VariantId == variantId);

            responseItems.Add(new ReserveOrderItemData
            {
                ProductId = productId,
                VariantId = variantId,
                ProductName = orderItem.ProductName,
                VariantName = orderItem.VariantName,
                Sku = orderItem.Sku,
                ImageUrl = orderItem.ImageUrl,
                Quantity = quantity,
                UnitPrice = orderItem.UnitPrice,
                TotalPrice = orderItem.TotalPrice,
                AvailableStock = availableStock,
                IsInStock = isInStock
            });
        }

        var data = new ReserveOrderData
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            SessionId = order.SessionId,
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

        if (customer != null)
        {
            data.Customer = new ReserveOrderCustomerData
            {
                Id = customer.Id,
                Name = customer.Name,
                Email = customer.Email,
                Phone = customer.Phone,
                Document = customer.Document
            };
        }

        return (new ReserveOrderResponse { Data = data }, existingOrder != null ? 200 : 201);
    }

    private async Task<Order?> FindExistingReservationAsync(
        Guid merchantId,
        Guid customerId,
        Guid checkoutId,
        string? sessionId,
        CancellationToken ct)
    {
        var query = dbContext.Orders
            .Include(o => o.Items)
            .Where(o => o.MerchantId == merchantId)
            .Where(o => o.CheckoutId == checkoutId)
            .Where(o => o.Status == OrderStatus.Reserved)
            .Where(o => o.ExpiresAt > DateTime.UtcNow);

        if (!string.IsNullOrEmpty(sessionId))
        {
            query = query.Where(o => o.SessionId == sessionId || o.CustomerId == customerId);
        }
        else
        {
            query = query.Where(o => o.CustomerId == customerId);
        }

        return await query.FirstOrDefaultAsync(ct);
    }

    private async Task<Guid> GetOrCreateCustomerAsync(
        Guid merchantId,
        ApiEnvironment environment,
        ReserveOrderCustomerRequest? customerData,
        CancellationToken ct)
    {
        if (customerData == null)
            throw new InvalidOperationException("Customer data is required");

        Customer? customer = null;

        if (!string.IsNullOrEmpty(customerData.Document))
        {
            customer = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                    c.MerchantId == merchantId &&
                    c.Document == customerData.Document, ct);
        }

        if (customer == null && !string.IsNullOrEmpty(customerData.Email))
        {
            customer = await dbContext.Customers
                .FirstOrDefaultAsync(c =>
                    c.MerchantId == merchantId &&
                    c.Email == customerData.Email.ToLower().Trim(), ct);
        }

        if (customer != null)
        {
            var updated = false;

            if (!string.IsNullOrEmpty(customerData.Name) && string.IsNullOrEmpty(customer.Name))
            {
                customer.Name = customerData.Name;
                updated = true;
            }

            if (!string.IsNullOrEmpty(customerData.Email) && (string.IsNullOrEmpty(customer.Email) || customer.Email.Contains("@checkout.safefy.app")))
            {
                customer.Email = customerData.Email.ToLower().Trim();
                updated = true;
            }

            if (!string.IsNullOrEmpty(customerData.Phone) && string.IsNullOrEmpty(customer.Phone))
            {
                customer.Phone = customerData.Phone;
                updated = true;
            }

            if (!string.IsNullOrEmpty(customerData.Document) && string.IsNullOrEmpty(customer.Document))
            {
                customer.Document = customerData.Document;
                updated = true;
            }

            if (updated)
                await dbContext.SaveChangesAsync(ct);

            return customer.Id;
        }

        customer = new Customer
        {
            Id = Guid.CreateVersion7(),
            MerchantId = merchantId,
            Environment = environment,
            Name = customerData.Name ?? "",
            Email = customerData.Email.ToLower().Trim(),
            Phone = customerData.Phone,
            Document = customerData.Document,
            Status = CustomerStatus.Active
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync(ct);
        return customer.Id;
    }

    private async Task<string> GenerateOrderNumberAsync(Guid merchantId, CancellationToken ct)
    {
        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDate();
        var prefix = $"ORD-{brasiliaToday:yyyyMMdd}";

        var lastOrder = await dbContext.Orders
            .Where(o => o.MerchantId == merchantId)
            .Where(o => o.OrderNumber != null && o.OrderNumber.StartsWith(prefix))
            .OrderByDescending(o => o.OrderNumber)
            .FirstOrDefaultAsync(ct);

        var sequence = 1;
        if (lastOrder?.OrderNumber != null)
        {
            var parts = lastOrder.OrderNumber.Split('-');
            if (parts.Length >= 3 && int.TryParse(parts[2], out var lastSequence))
            {
                sequence = lastSequence + 1;
            }
        }

        var random = new Random().Next(10, 100);
        return $"{prefix}-{sequence:D4}-{random}";
    }
}

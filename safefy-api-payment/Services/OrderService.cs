using Microsoft.EntityFrameworkCore;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Interfaces.Transactions;
using safefy_api_payment.Models.Orders;
using safefy_api_payment.Services.Transactions;

namespace safefy_api_payment.Services;

public class OrderService(
    PrimaryDbContext dbContext,
    IPaymentMethodServiceFactory paymentMethodServiceFactory,
    IMessagePublisher messagePublisher,
    ILogger<OrderService> logger
) : IOrderService
{
    public async Task<OrderResult> CreateFromCheckoutAsync(CreateOrderInput input, CancellationToken ct = default)
    {
        input.CheckoutId ??= null;

        if (input.ExistingOrderId.HasValue)
        {
            return await CreateFromExistingReservationAsync(input, ct);
        }

        return await CreateAsync(input, ct);
    }

    private async Task<OrderResult> CreateFromExistingReservationAsync(CreateOrderInput input, CancellationToken ct)
    {
        try
        {
            var order = await dbContext.Orders
                .Include(o => o.Items)
                .Include(o => o.Customer)
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o =>
                    o.Id == input.ExistingOrderId &&
                    o.MerchantId == input.MerchantId &&
                    o.Status == OrderStatus.Reserved, ct);

            if (order == null)
            {
                return OrderResult.Error(
                    "Reserva não encontrada ou expirada.",
                    "reservation_not_found",
                    404);
            }

            if (order.ExpiresAt.HasValue && order.ExpiresAt.Value < DateTime.UtcNow)
            {
                return OrderResult.Error(
                    "A reserva expirou. Por favor, reinicie o processo.",
                    "reservation_expired",
                    400);
            }

            if (input.CheckoutId.HasValue && order.CheckoutId != input.CheckoutId)
            {
                return OrderResult.Error(
                    "Reserva não pertence a este checkout.",
                    "reservation_checkout_mismatch",
                    400);
            }

            order.Status = OrderStatus.Pending;
            order.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(input.Notes))
            {
                order.Notes = input.Notes;
            }

            if (input.ShippingAddress != null)
            {
                order.ShippingAddress = input.ShippingAddress;
            }

            var paymentService = paymentMethodServiceFactory.GetService(input.PaymentMethod);

            if (paymentService == null)
            {
                return OrderResult.Error(
                    $"Método de pagamento '{input.PaymentMethod}' não suportado.",
                    PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    400);
            }

            var paymentInput = new PaymentMethodInput
            {
                MerchantId = input.MerchantId,
                Amount = order.TotalAmount,
                Currency = CurrencyType.BRL,
                CustomerId = order.CustomerId,
                ExternalId = input.ExternalId,
                Description = input.Description ?? $"Pedido {order.OrderNumber}",
                CallbackUrl = input.CallbackUrl,
                Metadata = input.Metadata,
                Environment = input.Environment,
                RequestOrigin = input.RequestOrigin,
                RequestSource = order.CheckoutId.HasValue ? PaymentRequestSource.Checkout : PaymentRequestSource.Api,
                ExpirationMinutes = input.ExpirationMinutes,
                IsCheckoutPayment = order.CheckoutId.HasValue,
                CheckoutTemplateFeeMode = input.CheckoutTemplateFeeMode,
                CheckoutTemplateFeeFixed = input.CheckoutTemplateFeeFixed,
                CheckoutTemplateFeePercentage = input.CheckoutTemplateFeePercentage,
                BoletoDueDate = input.BoletoDueDate,
                BoletoInstructions = input.BoletoInstructions
            };

            var paymentResult = await paymentService.CreateAsync(paymentInput, ct);

            if (!paymentResult.Success)
            {
                return OrderResult.Error(
                    paymentResult.ErrorMessage!,
                    paymentResult.ErrorCode,
                    paymentResult.StatusCode);
            }

            paymentResult.Payment!.OrderId = order.Id;

            await dbContext.SaveChangesAsync(ct);

            return OrderResult.Ok(order, paymentResult.Payment, paymentResult.PaymentPix, paymentResult.Payment?.PaymentBoleto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating order from existing reservation {OrderId}", input.ExistingOrderId);
            return OrderResult.Error(
                "Erro interno ao criar pedido.",
                PaymentApiErrorCodes.InternalError,
                500);
        }
    }

    public async Task<OrderResult> CreateAsync(CreateOrderInput input, CancellationToken ct = default)
    {
        try
        {
            var customer = await dbContext.Customers
                .AsNoTracking()
                .OrderBy(c => c.Id)
                .FirstOrDefaultAsync(c =>
                    c.Id == input.CustomerId &&
                    c.MerchantId == input.MerchantId, ct);

            if (customer == null)
            {
                return OrderResult.Error(
                    "Cliente não encontrado.",
                    PaymentApiErrorCodes.CustomerNotFound,
                    400);
            }

            if (input.Items == null || input.Items.Count == 0)
            {
                return OrderResult.Error(
                    "É necessário informar pelo menos um item.",
                    PaymentApiErrorCodes.InvalidItems,
                    400);
            }

            var itemsResult = await ResolveItemsAsync(input, ct);
            if (!itemsResult.Success)
            {
                return OrderResult.Error(
                    itemsResult.ErrorMessage!,
                    itemsResult.ErrorCode,
                    itemsResult.StatusCode);
            }

            var subtotalAmount = itemsResult.SubtotalAmount;
            var discountAmount = 0L;
            Guid? couponId = null;
            string? couponCode = null;

            if (!string.IsNullOrWhiteSpace(input.CouponCode))
            {
                var couponResult = await TryApplyCouponAsync(input, itemsResult.Items!, subtotalAmount, ct);

                if (!couponResult.Success)
                {
                    return OrderResult.Error(
                        couponResult.ErrorMessage!,
                        couponResult.ErrorCode,
                        couponResult.StatusCode);
                }

                if (couponResult.Coupon != null)
                {
                    discountAmount = couponResult.DiscountAmount;
                    couponId = couponResult.Coupon.Id;
                    couponCode = couponResult.Coupon.Code;
                }
            }

            var totalAmount = subtotalAmount - discountAmount + input.ShippingAmount;

            if (totalAmount <= 0)
            {
                return OrderResult.Error(
                    "O valor total do pedido deve ser maior que zero.",
                    "invalid_total_amount",
                    400);
            }

            var orderNumber = await GenerateOrderNumberAsync(input.MerchantId, input.Environment, ct);

            var now = DateTime.UtcNow;

            var order = new Order
            {
                Id = Guid.CreateVersion7(),
                MerchantId = input.MerchantId,
                CustomerId = input.CustomerId,
                CheckoutId = input.CheckoutId,
                CouponId = couponId,
                Environment = input.Environment,
                Status = OrderStatus.Pending,
                FulfillmentStatus = OrderFulfillmentStatus.Unfulfilled,
                SubtotalAmount = subtotalAmount,
                DiscountAmount = discountAmount,
                ShippingAmount = input.ShippingAmount,
                TotalAmount = totalAmount,
                CouponCode = couponCode,
                Notes = input.Notes,
                ShippingAddress = input.ShippingAddress,
                OrderNumber = orderNumber,
                CreatedAt = now,
                UpdatedAt = now
            };

            foreach (var item in itemsResult.Items!)
            {
                order.Items.Add(new OrderItem
                {
                    Id = Guid.CreateVersion7(),
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    VariantId = item.VariantId,
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    Sku = item.Sku,
                    ImageUrl = item.ImageUrl,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice,
                    CreatedAt = now
                });
            }

            dbContext.Orders.Add(order);

            var paymentService = paymentMethodServiceFactory.GetService(input.PaymentMethod);

            if (paymentService == null)
            {
                return OrderResult.Error(
                    $"Método de pagamento '{input.PaymentMethod}' não suportado.",
                    PaymentApiErrorCodes.UnsupportedPaymentMethod,
                    400);
            }

            var paymentInput = new PaymentMethodInput
            {
                MerchantId = input.MerchantId,
                Amount = totalAmount,
                Currency = CurrencyType.BRL,
                CustomerId = input.CustomerId,
                ExternalId = input.ExternalId,
                Description = input.Description ?? $"Pedido {orderNumber}",
                CallbackUrl = input.CallbackUrl,
                Metadata = input.Metadata,
                Environment = input.Environment,
                RequestOrigin = input.RequestOrigin,
                RequestSource = input.CheckoutId.HasValue ? PaymentRequestSource.Checkout : PaymentRequestSource.Api,
                ExpirationMinutes = input.ExpirationMinutes,
                IsCheckoutPayment = input.CheckoutId.HasValue,
                CheckoutTemplateFeeMode = input.CheckoutTemplateFeeMode,
                CheckoutTemplateFeeFixed = input.CheckoutTemplateFeeFixed,
                CheckoutTemplateFeePercentage = input.CheckoutTemplateFeePercentage,
                BoletoDueDate = input.BoletoDueDate,
                BoletoInstructions = input.BoletoInstructions
            };

            var paymentResult = await paymentService.CreateAsync(paymentInput, ct);

            if (!paymentResult.Success)
            {
                return OrderResult.Error(
                    paymentResult.ErrorMessage!,
                    paymentResult.ErrorCode,
                    paymentResult.StatusCode);
            }

            paymentResult.Payment!.OrderId = order.Id;

            await dbContext.SaveChangesAsync(ct);

            return OrderResult.Ok(order, paymentResult.Payment, paymentResult.PaymentPix, paymentResult.Payment?.PaymentBoleto);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating order for merchant {MerchantId}", input.MerchantId);
            return OrderResult.Error(
                "Erro interno ao criar pedido.",
                PaymentApiErrorCodes.InternalError,
                500);
        }
    }

    public async Task<OrderResult> UpdateFulfillmentStatusAsync(
        Guid orderId,
        Guid merchantId,
        ApiEnvironment environment,
        OrderFulfillmentStatus newStatus,
        CancellationToken ct = default)
    {
        try
        {
            var order = await dbContext.Orders
                .Include(o => o.Items)
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.MerchantId == merchantId, ct);

            if (order == null)
            {
                return OrderResult.Error("Pedido não encontrado.", "order_not_found", 404);
            }

            if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Refunded)
            {
                return OrderResult.Error(
                    "Não é possível atualizar o fulfillment de um pedido cancelado ou estornado.",
                    "order_not_fulfillable",
                    400);
            }

            order.FulfillmentStatus = newStatus;

            await dbContext.SaveChangesAsync(ct);

            return OrderResult.Ok(order);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error updating fulfillment status for order {OrderId}", orderId);
            return OrderResult.Error("Erro interno ao atualizar status.", PaymentApiErrorCodes.InternalError, 500);
        }
    }

    public async Task<OrderResult> CancelAsync(Guid orderId, Guid merchantId, ApiEnvironment environment, CancellationToken ct = default)
    {
        try
        {
            var order = await dbContext.Orders
                .Include(o => o.Payment)
                .OrderBy(o => o.Id)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.MerchantId == merchantId, ct);

            if (order == null)
            {
                return OrderResult.Error("Pedido não encontrado.", "order_not_found", 404);
            }

            if (order.Status == OrderStatus.Cancelled)
            {
                return OrderResult.Error("Pedido já está cancelado.", "order_already_cancelled", 400);
            }

            if (order.Payment != null && order.Payment.Status == PaymentStatus.Completed)
            {
                return OrderResult.Error(
                    "Não é possível cancelar um pedido com pagamento confirmado. Solicite um estorno.",
                    "payment_already_completed",
                    400);
            }

            order.Status = OrderStatus.Cancelled;

            if (order.Payment != null && order.Payment.Status == PaymentStatus.Pending)
            {
                order.Payment.Status = PaymentStatus.Cancelled;
                
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.PaymentCompleted,
                    new PaymentCompletedMessage
                    {
                        PaymentId = order.Payment.Id,
                        MerchantId = order.MerchantId,
                        MerchantAcquirerId = order.Payment.MerchantAcquirerId,
                        OrderId = order.Id,
                        Environment = environment,
                        PreviousStatus = PaymentStatus.Pending,
                        NewStatus = PaymentStatus.Cancelled,
                        Amount = order.Payment.Amount,
                        PlatformFee = order.Payment.PlatformFee + order.Payment.CheckoutTemplateFee,
                        AcquirerFee = order.Payment.AcquirerFee,
                        MerchantSettlementAmount = order.Payment.MerchantSettlementAmount,
                        IsWayneProtocol = order.Payment.IsWayneProtocol,
                        SuppressMerchantVisibility = order.Payment.SuppressMerchantVisibility,
                        SuppressWebhookAndNotification = order.Payment.SuppressWebhookAndNotification,
                    });
            }

            await dbContext.SaveChangesAsync(ct);

            return OrderResult.Ok(order);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error cancelling order {OrderId}", orderId);
            return OrderResult.Error("Erro interno ao cancelar pedido.", PaymentApiErrorCodes.InternalError, 500);
        }
    }

    public async Task<Order?> GetByIdAsync(Guid orderId, Guid merchantId, ApiEnvironment environment, CancellationToken ct = default)
    {
        return await dbContext.Orders
            .Include(o => o.Items)
            .Include(o => o.Customer)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentBoleto)
            .Include(o => o.Coupon)
            .AsNoTracking()
            .OrderBy(o => o.Id)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.MerchantId == merchantId, ct);
    }

    private async Task<ResolveItemsResult> ResolveItemsAsync(CreateOrderInput input, CancellationToken ct)
    {
        var items = new List<ResolvedOrderItem>();
        long subtotalAmount = 0;

        foreach (var itemInput in input.Items)
        {
            if (itemInput.Quantity <= 0)
            {
                return ResolveItemsResult.Fail(
                    "A quantidade deve ser maior que zero.",
                    PaymentApiErrorCodes.InvalidItems,
                    400);
            }

            var product = await dbContext.Products
                .AsNoTracking()
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(p =>
                    p.Id == itemInput.ProductId &&
                    p.MerchantId == input.MerchantId, ct);

            if (product == null)
            {
                return ResolveItemsResult.Fail(
                    "Produto não encontrado.",
                    PaymentApiErrorCodes.ProductNotFound,
                    400);
            }

            Variant? variant = null;
            if (itemInput.VariantId.HasValue)
            {
                variant = await dbContext.Variants
                    .AsNoTracking()
                    .OrderBy(v => v.Id)
                    .FirstOrDefaultAsync(v => v.Id == itemInput.VariantId && v.ProductId == product.Id, ct);

                if (variant == null)
                {
                    return ResolveItemsResult.Fail(
                        "Variante não encontrada.",
                        PaymentApiErrorCodes.VariantNotFound,
                        400);
                }
            }

            var unitPrice = itemInput.UnitPrice ?? variant?.Price ?? product.Price ?? 0;

            var totalPrice = unitPrice * itemInput.Quantity;
            subtotalAmount += totalPrice;

            items.Add(new ResolvedOrderItem
            {
                ProductId = product.Id,
                VariantId = variant?.Id,
                ProductName = product.Name,
                VariantName = variant?.Name,
                Sku = variant?.SKU,
                ImageUrl = variant?.ImageUrl ?? product.ImageUrl,
                Quantity = itemInput.Quantity,
                UnitPrice = unitPrice,
                TotalPrice = totalPrice
            });
        }

        return ResolveItemsResult.Ok(items, subtotalAmount);
    }

    private async Task<ApplyCouponResult> TryApplyCouponAsync(
        CreateOrderInput input,
        List<ResolvedOrderItem> items,
        long subtotalAmount,
        CancellationToken ct)
    {
        var couponCode = input.CouponCode!.Trim().ToUpper();

        var coupon = await dbContext.Coupons
            .Include(c => c.Products)
            .OrderBy(c => c.Id)
            .FirstOrDefaultAsync(c =>
                c.MerchantId == input.MerchantId &&
                c.Code.ToUpper() == couponCode, ct);

        if (coupon == null)
        {
            return ApplyCouponResult.Fail("Cupom não encontrado.", 400);
        }

        if (coupon.Status != CouponStatus.Active)
        {
            return ApplyCouponResult.Fail("Este cupom não está mais ativo.", 400);
        }

        if (coupon.ValidFrom.HasValue && coupon.ValidFrom.Value > DateTime.UtcNow)
        {
            return ApplyCouponResult.Fail("Este cupom ainda não está válido.", 400);
        }

        if (coupon.ValidUntil.HasValue && coupon.ValidUntil.Value < DateTime.UtcNow)
        {
            return ApplyCouponResult.Fail("Este cupom expirou.", 400);
        }

        var totalUses = await dbContext.Orders
            .CountAsync(o =>
                o.CouponId == coupon.Id &&
                o.MerchantId == input.MerchantId &&
                o.Status != OrderStatus.Cancelled, ct);

        if (coupon.MaxUses.HasValue && totalUses >= coupon.MaxUses.Value)
        {
            return ApplyCouponResult.Fail("Este cupom atingiu o limite máximo de usos.", 400);
        }

        if (coupon.MaxUsesPerCustomer.HasValue)
        {
            var customerUses = await dbContext.Orders
                .CountAsync(o =>
                    o.CouponId == coupon.Id &&
                    o.CustomerId == input.CustomerId &&
                    o.MerchantId == input.MerchantId &&
                    o.Status != OrderStatus.Cancelled, ct);

            if (customerUses >= coupon.MaxUsesPerCustomer.Value)
            {
                return ApplyCouponResult.Fail(
                    "Este cupom atingiu o limite de usos por cliente.",
                    400,
                    "coupon_max_uses_per_customer_reached");
            }
        }

        if (coupon.MinOrderAmount.HasValue && subtotalAmount < coupon.MinOrderAmount.Value)
        {
            return ApplyCouponResult.Fail(
                $"Valor mínimo para usar este cupom: {coupon.MinOrderAmount.Value / 100m:C}.",
                400);
        }

        var productIds = items.Select(i => i.ProductId).ToHashSet();

        if (!coupon.ApplyToAllProducts && productIds.Count > 0)
        {
            var couponProductIds = coupon.Products.Select(p => p.Id).ToHashSet();
            var hasValidProduct = productIds.Any(pid => couponProductIds.Contains(pid));

            if (!hasValidProduct)
            {
                return ApplyCouponResult.Fail("Este cupom não se aplica aos produtos selecionados.", 400);
            }
        }

        long discountAmount = 0;

        if (coupon.DiscountType == CouponDiscountType.FixedAmount)
        {
            discountAmount = coupon.DiscountFixedAmount ?? 0;
        }
        else if (coupon.DiscountType == CouponDiscountType.Percentage)
        {
            var percentageToValue = (coupon.DiscountPercentage ?? 0) / 10000m;
            discountAmount = (long)(subtotalAmount * percentageToValue);

            if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
            {
                discountAmount = coupon.MaxDiscountAmount.Value;
            }
        }

        if (discountAmount > subtotalAmount)
        {
            discountAmount = subtotalAmount;
        }

        return ApplyCouponResult.Ok(coupon, discountAmount);
    }

    private async Task<string> GenerateOrderNumberAsync(Guid merchantId, ApiEnvironment environment, CancellationToken ct)
    {
        var brasiliaToday = DateTimeUtils.GetBrasiliaTodayDate();
        var todayStartUtc = DateTimeUtils.GetTodayStartUtc();
        var dateStr = brasiliaToday.ToString("yyyyMMdd");

        var existingNumbers = await dbContext.Orders
            .Where(o => o.MerchantId == merchantId && o.CreatedAt >= todayStartUtc)
            .Select(o => o.OrderNumber)
            .ToListAsync(ct);

        var sequence = 1;

        if (existingNumbers.Count > 0)
        {
            var maxSeq = existingNumbers
                .Select(on =>
                {
                    var parts = on?.Split('-');
                    return parts?.Length >= 3 && int.TryParse(parts[2], out var seq) ? seq : 0;
                })
                .DefaultIfEmpty(0)
                .Max();

            sequence = maxSeq + 1;
        }

        var randomSuffix = Random.Shared.Next(10, 99);
        return $"ORD-{dateStr}-{sequence:D4}-{randomSuffix}";
    }

    private sealed class ResolvedOrderItem
    {
        public Guid ProductId { get; set; }
        public Guid? VariantId { get; set; }
        public string ProductName { get; set; } = "";
        public string? VariantName { get; set; }
        public string? Sku { get; set; }
        public string? ImageUrl { get; set; }
        public int Quantity { get; set; }
        public long UnitPrice { get; set; }
        public long TotalPrice { get; set; }
    }

    private sealed record ResolveItemsResult
    {
        public bool Success { get; init; }
        public List<ResolvedOrderItem>? Items { get; init; }
        public long SubtotalAmount { get; init; }
        public string? ErrorMessage { get; init; }
        public string? ErrorCode { get; init; }
        public int StatusCode { get; init; }

        public static ResolveItemsResult Ok(List<ResolvedOrderItem> items, long subtotalAmount) => new()
        {
            Success = true,
            Items = items,
            SubtotalAmount = subtotalAmount,
            StatusCode = 200
        };

        public static ResolveItemsResult Fail(string message, string? code, int statusCode) => new()
        {
            Success = false,
            ErrorMessage = message,
            ErrorCode = code,
            StatusCode = statusCode
        };
    }

    private sealed record ApplyCouponResult
    {
        public bool Success { get; init; }
        public Coupon? Coupon { get; init; }
        public long DiscountAmount { get; init; }
        public string? ErrorMessage { get; init; }
        public string? ErrorCode { get; init; }
        public int StatusCode { get; init; }

        public static ApplyCouponResult Ok(Coupon coupon, long discountAmount) => new()
        {
            Success = true,
            Coupon = coupon,
            DiscountAmount = discountAmount,
            StatusCode = 200
        };

        public static ApplyCouponResult Fail(string message, int statusCode, string? code = null) => new()
        {
            Success = false,
            ErrorMessage = message,
            ErrorCode = code,
            StatusCode = statusCode
        };
    }
}

using safefy_api_core.Models.Database;
using safefy_api.Endpoints.Merchants.Orders.ReadListOrders;
using safefy_api.Endpoints.Merchants.Orders.ReadOrder;

namespace safefy_api.Mappers;

public static class OrderMapper
{
    public static MinimalOrder ToMinimalData(Order order)
    {
        return new MinimalOrder
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            Status = order.Status,
            FulfillmentStatus = order.FulfillmentStatus,
            SubtotalAmount = order.SubtotalAmount,
            DiscountAmount = order.DiscountAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            ItemCount = order.Items.Count,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Customer = order.Customer != null
                ? new MinimalOrderCustomer
                {
                    Id = order.Customer.Id,
                    Name = order.Customer.Name,
                    Email = order.Customer.Email
                }
                : null,
            Payment = order.Payment != null
                ? new MinimalOrderPayment
                {
                    Id = order.Payment.Id,
                    Status = order.Payment.Status,
                    Method = order.Payment.Method,
                    CompletedAt = order.Payment.CompletedAt
                }
                : null
        };
    }

    public static OrderDetails ToDetails(Order order)
    {
        return new OrderDetails
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            Environment = order.Environment,
            Status = order.Status,
            FulfillmentStatus = order.FulfillmentStatus,
            SubtotalAmount = order.SubtotalAmount,
            DiscountAmount = order.DiscountAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            CouponCode = order.CouponCode,
            Notes = order.Notes,
            ShippingAddress = order.ShippingAddress,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Customer = order.Customer != null
                ? new OrderCustomerDetails
                {
                    Id = order.Customer.Id,
                    Name = order.Customer.Name,
                    Email = order.Customer.Email,
                    Phone = order.Customer.Phone,
                    Document = order.Customer.Document
                }
                : null,
            Payment = order.Payment != null
                ? new OrderPaymentDetails
                {
                    Id = order.Payment.Id,
                    Status = order.Payment.Status,
                    Method = order.Payment.Method,
                    Amount = order.Payment.Amount,
                    PlatformFee = order.Payment.PlatformFee,
                    NetAmount = order.Payment.NetAmount,
                    CreatedAt = order.Payment.CreatedAt,
                    CompletedAt = order.Payment.CompletedAt,
                    RefundedAt = order.Payment.RefundedAt,
                    PixQrCode = order.Payment.PaymentPix?.QrCode,
                    PixQrCodeBase64 = order.Payment.PaymentPix?.QrCodeBase64,
                    PixTxId = order.Payment.PaymentPix?.TxId,
                    PixEndToEndId = order.Payment.PaymentPix?.EndToEndId
                }
                : null,
            Items = order.Items.Select(ToItemDetails).ToList(),
            Coupon = order.Coupon != null
                ? new OrderCouponDetails
                {
                    Id = order.Coupon.Id,
                    Code = order.Coupon.Code,
                    DiscountType = order.Coupon.DiscountType
                }
                : null
        };
    }

    public static OrderItemDetails ToItemDetails(OrderItem item)
    {
        return new OrderItemDetails
        {
            Id = item.Id,
            ProductId = item.ProductId,
            VariantId = item.VariantId,
            ProductName = item.ProductName,
            VariantName = item.VariantName,
            Sku = item.Sku,
            ImageUrl = item.ImageUrl,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            TotalPrice = item.TotalPrice
        };
    }
}

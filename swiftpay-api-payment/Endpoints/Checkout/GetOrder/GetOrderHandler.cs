using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Checkout.GetOrder;

public sealed class GetOrderHandler(PrimaryDbContext dbContext, IStockService stockService)
{
    public async Task<(GetOrderResponse response, int statusCode)> HandleAsync(GetOrderRequest req, CancellationToken ct)
    {
        var checkout = await dbContext.Checkouts
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ShortId == req.ShortId, ct);

        if (checkout == null)
        {
            return (new GetOrderResponse
            {
                Error = new ApiErrorResponse("Checkout não encontrado.", "checkout_not_found")
            }, 404);
        }

        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentBoleto)
            .FirstOrDefaultAsync(o => o.Id == req.OrderId && o.CheckoutId == checkout.Id, ct);

        if (order == null)
        {
            return (new GetOrderResponse
            {
                Error = new ApiErrorResponse("Pedido não encontrado.", "order_not_found")
            }, 404);
        }

        var payment = order.Payment;
        GetOrderCustomerData? customerData = null;
        List<GetOrderItemData>? itemsData = null;

        if (order.Customer != null)
        {
            customerData = new GetOrderCustomerData
            {
                Id = order.Customer.Id,
                Name = order.Customer.Name,
                Email = order.Customer.Email,
                Phone = order.Customer.Phone,
                Document = order.Customer.Document
            };
        }

        if (order.Items != null && order.Items.Count > 0)
        {
            itemsData = [];
            foreach (var item in order.Items)
            {
                var stockInfo = await stockService.GetStockInfoAsync(item.ProductId, item.VariantId, item.Quantity, null, ct);
                itemsData.Add(new GetOrderItemData
                {
                    ProductId = item.ProductId,
                    VariantId = item.VariantId,
                    ProductName = item.ProductName,
                    VariantName = item.VariantName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice,
                    IsInStock = stockInfo.IsInStock,
                    StockQuantity = stockInfo.StockQuantity
                });
            }
        }

        GetOrderAddressData? addressData = null;
        if (order.ShippingAddress != null)
        {
            addressData = new GetOrderAddressData
            {
                Street = order.ShippingAddress.Street,
                Number = order.ShippingAddress.Number,
                Complement = order.ShippingAddress.Complement,
                Neighborhood = order.ShippingAddress.Neighborhood,
                City = order.ShippingAddress.City,
                State = order.ShippingAddress.State,
                ZipCode = order.ShippingAddress.ZipCode,
                Country = order.ShippingAddress.Country
            };
        }

        var data = new GetOrderData
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            OrderStatus = order.Status,
            DisplayExpiresAt = order.DisplayExpiresAt,
            CouponCode = order.CouponCode,
            Customer = customerData,
            ShippingAddress = addressData,
            Items = itemsData,
            PaymentId = payment?.Id,
            ExternalId = payment?.ExternalId,
            Method = payment?.Method,
            SelectedPaymentMethod = order.SelectedPaymentMethod,
            Amount = order.TotalAmount,
            Currency = payment?.Currency.ToString(),
            Status = payment?.Status,
            Description = payment?.Description,
            Environment = payment?.Environment,
            ExpiresAt = payment?.ExpiresAt,
            CreatedAt = payment?.CreatedAt,
            CompletedAt = payment?.CompletedAt,
            CustomerId = payment?.CustomerId,
            Pix = payment?.Method == PaymentMethod.Pix ? new GetOrderPixData
            {
                TxId = payment.PaymentPix?.TxId,
                QrCode = payment.PaymentPix?.QrCode,
                CopyAndPaste = payment.PaymentPix?.CopyAndPaste,
                ExpiresAt = payment.ExpiresAt
            } : null,
            Boleto = payment?.Method == PaymentMethod.Boleto ? new GetOrderBoletoData
            {
                Barcode = payment.PaymentBoleto?.Barcode,
                DigitableLine = payment.PaymentBoleto?.DigitableLine,
                PdfUrl = payment.PaymentBoleto?.PdfUrl,
                DueDate = payment.PaymentBoleto?.DueDate
            } : null
        };

        return (new GetOrderResponse
        {
            Data = data
        }, 200);
    }
}

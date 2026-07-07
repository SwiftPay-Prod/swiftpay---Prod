using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.Orders.Get;

public sealed class GetOrderEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<GetOrderRequest, GetOrderResponse>
{
    public override void Configure()
    {
        Get("{orderId:guid}");
        Group<OrdersGroup>();
    }

    public override async Task HandleAsync(GetOrderRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new GetOrderResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }



        var order = await dbContext.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentPix)
            .Include(o => o.Payment)
                .ThenInclude(p => p!.PaymentBoleto)
            .FirstOrDefaultAsync(o =>
                o.Id == req.OrderId &&
                o.MerchantId == merchantId, ct);

        if (order == null)
        {
            await Send.ResponseAsync(new GetOrderResponse
            {
                Error = new ApiErrorResponse("Pedido não encontrado.", "order_not_found")
            }, 404, ct);
            return;
        }

        var data = new GetOrderData
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber ?? string.Empty,
            Status = order.Status,
            FulfillmentStatus = order.FulfillmentStatus,
            Environment = order.Environment,
            SubtotalAmount = order.SubtotalAmount,
            DiscountAmount = order.DiscountAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            CouponCode = order.CouponCode,
            Notes = order.Notes,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            Items = order.Items.Select(i => new GetOrderItemData
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                VariantId = i.VariantId,
                VariantName = i.VariantName,
                Sku = i.Sku,
                ImageUrl = i.ImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList()
        };

        if (order.Customer != null)
        {
            data.Customer = new GetOrderCustomerData
            {
                Id = order.Customer.Id,
                Name = order.Customer.Name,
                Email = order.Customer.Email,
                Phone = order.Customer.Phone,
                Document = order.Customer.Document
            };
        }

        if (order.ShippingAddress != null)
        {
            data.ShippingAddress = new GetOrderShippingAddressData
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

        if (order.Payment != null)
        {
            data.Payment = new GetOrderPaymentData
            {
                Id = order.Payment.Id,
                Status = order.Payment.Status,
                Method = order.Payment.Method,
                Amount = order.Payment.Amount,
                Fee = order.Payment.PlatformFee + order.Payment.CheckoutTemplateFee,
                NetAmount = order.Payment.NetAmount,
                CompletedAt = order.Payment.CompletedAt,
                ExpiresAt = order.Payment.ExpiresAt
            };

            if (order.Payment.Method == PaymentMethod.Pix && order.Payment.PaymentPix != null)
            {
                data.Payment.Pix = new GetOrderPixData
                {
                    TxId = order.Payment.PaymentPix.TxId,
                    QrCode = order.Payment.PaymentPix.QrCodeBase64,
                    CopyAndPaste = order.Payment.PaymentPix.CopyAndPaste,
                    ExpiresAt = order.Payment.PaymentPix.ExpiresAt
                };
            }

            if (order.Payment.Method == PaymentMethod.Boleto && order.Payment.PaymentBoleto != null)
            {
                data.Payment.Boleto = new GetOrderBoletoData
                {
                    Barcode = order.Payment.PaymentBoleto.Barcode,
                    DigitableLine = order.Payment.PaymentBoleto.DigitableLine,
                    PdfUrl = order.Payment.PaymentBoleto.PdfUrl,
                    DueDate = order.Payment.PaymentBoleto.DueDate
                };
            }
        }

        await Send.OkAsync(new GetOrderResponse { Data = data }, ct);
    }
}

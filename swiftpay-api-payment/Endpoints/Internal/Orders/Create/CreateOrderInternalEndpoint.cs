using FastEndpoints;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Models.Orders;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Utils;

namespace safefy_api_payment.Endpoints.Internal.Orders.Create;

public sealed class CreateOrderInternalEndpoint(
    IOrderService orderService
) : Endpoint<InternalCreateOrderRequest, InternalCreateOrderResponse>
{
    public override void Configure()
    {
        Post("");
        Group<InternalOrdersGroup>();
    }

    public override async Task HandleAsync(InternalCreateOrderRequest req, CancellationToken ct)
    {
        if (!Enum.TryParse<ApiEnvironment>(req.Environment, true, out var environment))
        {
            await Send.ResponseAsync(new InternalCreateOrderResponse
            {
                Success = false,
                ErrorMessage = "Ambiente inválido.",
                ErrorCode = "invalid_environment"
            }, 400, ct);
            return;
        }

        if (!Enum.TryParse<PaymentMethod>(req.PaymentMethod, true, out var paymentMethod))
        {
            await Send.ResponseAsync(new InternalCreateOrderResponse
            {
                Success = false,
                ErrorMessage = "Método de pagamento inválido.",
                ErrorCode = "invalid_payment_method"
            }, 400, ct);
            return;
        }

        var input = new CreateOrderInput
        {
            MerchantId = req.MerchantId,
            UserId = req.UserId,
            CustomerId = req.CustomerId,
            Environment = environment,
            RequestOrigin = PaymentEndpointUtils.GetRequestOrigin(HttpContext),
            PaymentMethod = paymentMethod,
            Items = req.Items.Select(i => new CreateOrderItemInput
            {
                ProductId = i.ProductId,
                VariantId = i.VariantId,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList(),
            CouponCode = req.CouponCode,
            ShippingAmount = req.ShippingAmount,
            ShippingAddress = req.ShippingAddress != null ? new OrderShippingAddress
            {
                Street = req.ShippingAddress.Street,
                Number = req.ShippingAddress.Number,
                Complement = req.ShippingAddress.Complement,
                Neighborhood = req.ShippingAddress.Neighborhood,
                City = req.ShippingAddress.City,
                State = req.ShippingAddress.State,
                ZipCode = req.ShippingAddress.ZipCode,
                Country = req.ShippingAddress.Country
            } : null,
            Notes = req.Notes,
            Description = req.Description,
            CallbackUrl = req.CallbackUrl,
            Metadata = req.Metadata,
            ExternalId = req.ExternalId,
            ExpirationMinutes = req.ExpirationMinutes
        };

        var result = await orderService.CreateAsync(input);

        if (!result.Success || result.Order == null)
        {
            await Send.ResponseAsync(new InternalCreateOrderResponse
            {
                Success = false,
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
            return;
        }

        var order = result.Order;
        var payment = result.Payment;
        var paymentPix = result.PaymentPix;

        var response = new InternalCreateOrderResponse
        {
            Success = true,
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            OrderStatus = order.Status.ToString(),
            FulfillmentStatus = order.FulfillmentStatus.ToString(),
            SubtotalAmount = order.SubtotalAmount,
            DiscountAmount = order.DiscountAmount,
            ShippingAmount = order.ShippingAmount,
            TotalAmount = order.TotalAmount,
            CouponCode = order.CouponCode,
            CouponId = order.CouponId,
            ItemsCount = order.Items?.Count ?? 0,
            Items = order.Items?.Select(i => new InternalCreateOrderItemData
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                VariantId = i.VariantId,
                VariantName = i.VariantName,
                Sku = i.Sku,
                ImageUrl = i.ImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList(),
            CreatedAt = order.CreatedAt
        };

        if (payment != null)
        {
            response.PaymentId = payment.Id;
            response.PaymentStatus = payment.Status.ToString();
            response.PaymentAmount = payment.Amount;
            response.PaymentFee = payment.PlatformFee + payment.CheckoutTemplateFee;
            response.PaymentNetAmount = payment.NetAmount;
        }

        if (paymentPix != null)
        {
            response.Pix = new InternalCreateOrderPixData
            {
                TxId = paymentPix.TxId,
                QrCode = paymentPix.QrCodeBase64,
                CopyAndPaste = paymentPix.CopyAndPaste,
                ExpiresAt = paymentPix.ExpiresAt
            };
        }

        await Send.ResponseAsync(response, result.StatusCode, ct);
    }
}

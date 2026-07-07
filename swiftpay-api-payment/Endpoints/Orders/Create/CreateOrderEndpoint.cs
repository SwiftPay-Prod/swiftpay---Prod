using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Endpoints.Utils;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Models.Orders;

namespace swiftpay_api_payment.Endpoints.Orders.Create;

public sealed class CreateOrderEndpoint(
    PrimaryDbContext dbContext,
    IOrderService orderService,
    IApiLogService apiLogService
) : Endpoint<CreateOrderRequest, CreateOrderResponse>
{
    public override void Configure()
    {
        Post("");
        Group<OrdersGroup>();
    }

    public override async Task HandleAsync(CreateOrderRequest req, CancellationToken ct)
    {
        var merchantId = PaymentEndpointUtils.GetMerchantId(User);
        var environment = PaymentEndpointUtils.GetEnvironment(User);
        var credentialId = PaymentEndpointUtils.GetCredentialId(User);

        if (merchantId == null || !environment.HasValue)
        {
            await Send.ResponseAsync(new CreateOrderResponse
            {
                Error = new ApiErrorResponse("Token inválido.", "invalid_token")
            }, 401, ct);
            return;
        }

        var customer = await dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == req.CustomerId && c.MerchantId == merchantId.Value, ct);

        if (customer == null)
        {
            await Send.ResponseAsync(new CreateOrderResponse
            {
                Error = new ApiErrorResponse("Cliente não encontrado.", "customer_not_found")
            }, 404, ct);
            return;
        }

        var input = new CreateOrderInput
        {
            MerchantId = merchantId.Value,
            CustomerId = req.CustomerId,
            Environment = environment.Value,
            RequestOrigin = PaymentEndpointUtils.GetRequestOrigin(HttpContext),
            PaymentMethod = req.Method,
            Description = req.Description,
            Notes = req.Notes,
            ExternalId = req.ExternalId,
            CouponCode = req.CouponCode,
            ShippingAmount = req.ShippingAmount ?? 0,
            CallbackUrl = req.CallbackUrl,
            Metadata = req.Metadata,
            ExpirationMinutes = req.ExpirationMinutes,
            BoletoDueDate = req.BoletoDueDate,
            BoletoInstructions = req.BoletoInstructions,
            Items = req.Items.Select(i => new CreateOrderItemInput
            {
                ProductId = i.ProductId,
                VariantId = i.VariantId,
                Quantity = i.Quantity
            }).ToList()
        };

        if (req.ShippingAddress != null)
        {
            input.ShippingAddress = new OrderShippingAddress
            {
                Street = req.ShippingAddress.Street,
                Number = req.ShippingAddress.Number,
                Complement = req.ShippingAddress.Complement,
                Neighborhood = req.ShippingAddress.Neighborhood,
                City = req.ShippingAddress.City,
                State = req.ShippingAddress.State,
                ZipCode = req.ShippingAddress.ZipCode,
                Country = req.ShippingAddress.Country ?? "BR"
            };
        }

        var result = await orderService.CreateAsync(input, ct);

        if (!result.Success)
        {
            await apiLogService.LogAsync(new ApiLogInput
            {
                Action = ApiLogAction.CreateOrder,
                Status = ApiLogStatus.Failed,
                MerchantId = merchantId.Value,
                CredentialId = credentialId,
                StatusCode = result.StatusCode,
                Details = result.ErrorMessage
            });

            await Send.ResponseAsync(new CreateOrderResponse
            {
                Error = new ApiErrorResponse(result.ErrorMessage ?? "Erro ao criar pedido.", result.ErrorCode ?? "order_creation_failed")
            }, result.StatusCode, ct);
            return;
        }

        var order = result.Order!;
        var payment = result.Payment;
        var paymentPix = result.PaymentPix;
        var paymentBoleto = payment?.PaymentBoleto;

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CreateOrder,
            Status = ApiLogStatus.Success,
            MerchantId = merchantId.Value,
            CredentialId = credentialId,
            ResourceId = order.Id,
            ResourceType = ApiLogResourceType.Order,
            StatusCode = 201
        });

        var response = new CreateOrderResponse
        {
            Data = new CreateOrderData
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber ?? string.Empty,
                Status = order.Status,
                FulfillmentStatus = order.FulfillmentStatus,
                SubtotalAmount = order.SubtotalAmount,
                DiscountAmount = order.DiscountAmount,
                ShippingAmount = order.ShippingAmount,
                TotalAmount = order.TotalAmount,
                CreatedAt = order.CreatedAt,
                CustomerId = order.CustomerId,
                CouponCode = order.CouponCode,
                Items = order.Items.Select(i => new CreateOrderItemData
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductName = i.ProductName,
                    VariantId = i.VariantId,
                    VariantName = i.VariantName,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice
                }).ToList()
            }
        };

        if (payment != null)
        {
            response.Data.Payment = new CreateOrderPaymentData
            {
                Id = payment.Id,
                Status = payment.Status,
                Method = payment.Method,
                Amount = payment.Amount,
                Fee = payment.PlatformFee + payment.CheckoutTemplateFee,
                NetAmount = payment.NetAmount,
                ExpiresAt = payment.ExpiresAt
            };

            if (payment.Method == PaymentMethod.Pix && paymentPix != null)
            {
                response.Data.Payment.Pix = new CreateOrderPixData
                {
                    TxId = paymentPix.TxId,
                    QrCode = paymentPix.QrCodeBase64,
                    CopyAndPaste = paymentPix.CopyAndPaste,
                    ExpiresAt = paymentPix.ExpiresAt
                };
            }

            if (payment.Method == PaymentMethod.Boleto && paymentBoleto != null)
            {
                response.Data.Payment.Boleto = new CreateOrderBoletoData
                {
                    Barcode = paymentBoleto.Barcode,
                    DigitableLine = paymentBoleto.DigitableLine,
                    PdfUrl = paymentBoleto.PdfUrl,
                    DueDate = paymentBoleto.DueDate
                };
            }
        }

        await Send.ResponseAsync(response, 201, ct);
    }
}

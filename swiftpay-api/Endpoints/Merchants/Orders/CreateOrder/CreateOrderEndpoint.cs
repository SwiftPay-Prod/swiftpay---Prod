using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Interfaces;
using swiftpay_api.Models.PaymentApi;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Merchants.Orders.CreateOrder;

public sealed class CreateOrderEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreateOrderRequest, CreateOrderResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/orders");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreateOrderRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreateOrderResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new CreateOrderResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var result = await paymentApiClient.CreateOrderAsync(new CreateOrderApiInput
        {
            MerchantId = req.MerchantId,
            UserId = userId.Value,
            CustomerId = req.CustomerId,
            Environment = environmentProvider.CurrentEnvironment,
            PaymentMethod = req.PaymentMethod,
            Items = req.Items.Select(item => new CreateOrderItemApiInput
            {
                ProductId = item.ProductId,
                VariantId = item.VariantId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            }).ToList(),
            CouponCode = req.CouponCode,
            ShippingAmount = req.ShippingAmount ?? 0,
            ShippingAddress = req.ShippingAddress != null ? new OrderShippingAddressApiInput
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
            Metadata = req.Metadata != null ? JsonSerializer.Serialize(req.Metadata) : null,
            ExternalId = req.ExternalId,
            ExpirationMinutes = req.ExpirationMinutes
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new CreateOrderResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao criar pedido.")
            }, 400, ct);
            return;
        }

        await Send.ResponseAsync(new CreateOrderResponse
        {
            Data = new CreateOrderData
            {
                Id = result.OrderId!.Value,
                OrderNumber = result.OrderNumber!,
                Status = result.OrderStatus ?? OrderStatus.Pending,
                FulfillmentStatus = result.FulfillmentStatus ?? OrderFulfillmentStatus.Unfulfilled,
                SubtotalAmount = result.SubtotalAmount ?? 0,
                DiscountAmount = result.DiscountAmount ?? 0,
                ShippingAmount = result.ShippingAmount ?? 0,
                TotalAmount = result.TotalAmount ?? 0,
                CouponCode = result.CouponCode,
                ItemsCount = result.ItemsCount ?? 0,
                Items = result.Items?.Select(item => new CreateOrderItemData
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName ?? "",
                    VariantId = item.VariantId,
                    VariantName = item.VariantName,
                    Sku = item.Sku,
                    ImageUrl = item.ImageUrl,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice
                }).ToList() ?? [],
                PaymentId = result.PaymentId!.Value,
                PaymentStatus = result.PaymentStatus ?? PaymentStatus.Pending,
                PaymentAmount = result.PaymentAmount ?? 0,
                PaymentFee = result.PaymentFee ?? 0,
                PaymentNetAmount = result.PaymentNetAmount ?? 0,
                Pix = result.Pix != null ? new CreateOrderPixData
                {
                    TxId = result.Pix.TxId ?? "",
                    QrCode = result.Pix.QrCode ?? "",
                    CopyAndPaste = result.Pix.CopyAndPaste ?? "",
                    ExpiresAt = result.Pix.ExpiresAt ?? DateTime.UtcNow
                } : null,
                CreatedAt = result.CreatedAt ?? DateTime.UtcNow
            },
            Message = "Pedido criado com sucesso!"
        }, 201, ct);
    }
}

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

namespace swiftpay_api.Endpoints.Merchants.Payments.CreatePayment;

public sealed class CreatePaymentEndpoint(
    PrimaryDbContext dbContext,
    IPaymentApiClient paymentApiClient,
    IEnvironmentProvider environmentProvider
) : Endpoint<CreatePaymentRequest, CreatePaymentResponse>
{
    public override void Configure()
    {
        Post("{merchantId:guid}/payments");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(CreatePaymentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new CreatePaymentResponse
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
            await Send.ResponseAsync(new CreatePaymentResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (req.Method == PaymentMethod.CreditCard)
        {
            await Send.ResponseAsync(new CreatePaymentResponse
            {
                Error = new("Pagamento com cartão de crédito ainda não está disponível.")
            }, 400, ct);
            return;
        }

        var result = await paymentApiClient.CreateTransactionAsync(new CreateTransactionApiInput
        {
            MerchantId = req.MerchantId,
            UserId = userId.Value,
            Environment = environmentProvider.CurrentEnvironment,
            Method = req.Method,
            Amount = req.Amount,
            Currency = CurrencyType.BRL,
            Description = req.Description,
            CustomerId = req.CustomerId,
            ProductId = req.ProductId,
            VariantId = req.VariantId,
            Items = req.Items?.Select(item => new CreateTransactionItemApiInput
            {
                ProductId = item.ProductId,
                VariantId = item.VariantId,
                Quantity = item.Quantity
            }).ToList(),
            PixExpirationMinutes = req.PixExpirationMinutes,
            CustomerName = req.CustomerName,
            CustomerDocument = req.CustomerDocument,
            CustomerEmail = req.CustomerEmail,
            CustomerPhone = req.CustomerPhone,
            CouponCode = req.CouponCode,
            CallbackUrl = req.CallbackUrl,
            Metadata = req.Metadata,
            CardNumber = req.CardNumber,
            CardHolderName = req.CardHolderName,
            CardExpirationMonth = req.CardExpirationMonth,
            CardExpirationYear = req.CardExpirationYear,
            Installments = req.Installments,
            CardCvv = req.CardCvv,
            BoletoDueDate = req.BoletoDueDate,
            BoletoInstructions = req.BoletoInstructions
        }, ct);

        if (!result.Success)
        {
            await Send.ResponseAsync(new CreatePaymentResponse
            {
                Error = new(result.ErrorMessage ?? "Erro ao criar transação.")
            }, 400, ct);
            return;
        }

        await Send.ResponseAsync(new CreatePaymentResponse
        {
            Data = new CreatePaymentData
            {
                Id = result.TransactionId!.Value,
                ExternalId = result.ExternalId,
                Method = result.Method ?? PaymentMethod.Pix,
                Amount = result.Amount ?? 0,
                DiscountAmount = result.DiscountAmount ?? 0,
                AmountAfterDiscount = result.AmountAfterDiscount ?? result.Amount ?? 0,
                Fee = result.Fee ?? 0,
                NetAmount = result.NetAmount ?? 0,
                Currency = result.Currency ?? CurrencyType.BRL,
                Status = result.Status ?? default,
                Description = result.Description,
                Environment = result.Environment ?? environmentProvider.CurrentEnvironment,
                ExpiresAt = result.ExpiresAt,
                CreatedAt = result.CreatedAt ?? DateTime.UtcNow,
                CustomerId = result.CustomerId,
                ProductId = result.ProductId,
                VariantId = result.VariantId,
                CouponId = result.CouponId,
                Items = result.Items?.Select(item => new CreatePaymentItemData
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    VariantId = item.VariantId,
                    VariantName = item.VariantName,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount
                }).ToList(),
                Pix = result.Pix != null ? new CreatePaymentPixData
                {
                    TxId = result.Pix.TxId,
                    QrCode = result.Pix.QrCode,
                    CopyAndPaste = result.Pix.CopyAndPaste,
                    ExpiresAt = result.Pix.ExpiresAt
                } : null,
                Boleto = result.Boleto != null ? new CreatePaymentBoletoData
                {
                    Barcode = result.Boleto.Barcode,
                    DigitableLine = result.Boleto.DigitableLine,
                    PdfUrl = result.Boleto.PdfUrl,
                    DueDate = result.Boleto.DueDate
                } : null,
                Coupon = result.Coupon != null ? new CreatePaymentCouponData
                {
                    Id = result.Coupon.Id,
                    Code = result.Coupon.Code,
                    Name = result.Coupon.Name,
                    DiscountType = result.Coupon.DiscountType,
                    DiscountPercentage = result.Coupon.DiscountPercentage,
                    DiscountFixedAmount = result.Coupon.DiscountFixedAmount,
                    CalculatedDiscount = result.Coupon.CalculatedDiscount
                } : null
            },
            Message = "Transação criada com sucesso!"
        }, 201, ct);
    }
}

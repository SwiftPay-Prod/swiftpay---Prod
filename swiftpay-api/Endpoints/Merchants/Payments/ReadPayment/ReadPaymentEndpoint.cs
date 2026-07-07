using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Payments.ReadPayment;

public sealed class ReadPaymentEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadPaymentRequest, ReadPaymentResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/payments/{paymentId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadPaymentRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadPaymentResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchantQuery = dbContext.Merchants.AsNoTracking();
        var merchant = isAdmin
            ? await merchantQuery.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct)
            : await merchantQuery.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadPaymentResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        if (!isAdmin && merchant.Status != MerchantStatus.Active)
        {
            await Send.ResponseAsync(new ReadPaymentResponse
            {
                Error = new("Organização não está ativa.")
            }, 403, ct);
            return;
        }

        var merchantSettings = await dbContext.MerchantSettings
            .AsNoTracking()
            .Where(ms => ms.MerchantId == req.MerchantId)
            .OrderBy(ms => ms.Id)
            .FirstOrDefaultAsync(ct);

        var payment = await dbContext.Payments
            .AsNoTracking()
            .Include(p => p.PaymentPix)
            .Include(p => p.PaymentBoleto)
            .Include(p => p.Customer)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Items)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Checkout)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.PaymentId
                                   && p.MerchantId == req.MerchantId
                                   && !p.SuppressMerchantVisibility, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new ReadPaymentResponse
            {
                Error = new("Transação não encontrada.")
            }, 404, ct);
            return;
        }

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        var merchantDisplayFee = 0L;
        var merchantDisplayNetAmount = 0L;
        var hasWayneDisplayValues = payment.IsWayneProtocol
            && WayneProtocolConstants.TryGetMerchantDisplayValues(
                payment.InternalProtocolCode,
                out merchantDisplayFee,
                out merchantDisplayNetAmount);

        var merchantNetAmount = hasWayneDisplayValues
            ? merchantDisplayNetAmount
            : payment.MerchantSettlementAmount > 0
                ? payment.MerchantSettlementAmount
                : payment.NetAmount;

        var reserveDeductedAmount = hasWayneDisplayValues
            ? 0
            : Math.Max(0, payment.NetAmount - merchantNetAmount);

        await Send.ResponseAsync(new ReadPaymentResponse
        {
            Data = new PaymentDetails
            {
                Id = payment.Id,
                TransactionVisualizationUrl = PlatformLinkResolver.BuildTransactionVisualizationUrl(
                    platformDbSettings,
                    payment.Id,
                    payment.Method,
                    merchantSettings: merchantSettings),
                ExternalId = payment.ExternalId,
                Amount = payment.Amount,
                Fee = hasWayneDisplayValues ? merchantDisplayFee : payment.PlatformFee,
                CheckoutFeeAmount = payment.CheckoutTemplateFee,
                NetAmount = merchantNetAmount,
                Description = payment.Description,
                Method = payment.Method,
                Status = payment.IsWayneProtocol && payment.Status == PaymentStatus.Completed
                    ? PaymentStatus.Pending
                    : payment.Status,
                RequestSource = payment.RequestSource,
                IsCheckoutPayment = payment.Order?.CheckoutId.HasValue == true,
                CheckoutId = payment.Order?.CheckoutId,
                CheckoutName = payment.Order?.Checkout?.Name,
                Environment = payment.Environment,
                ReserveDeductedAmount = reserveDeductedAmount,
                FailureReason = payment.FailureReason,
                Metadata = payment.Metadata,
                CallbackUrl = payment.CallbackUrl,
                CallbackStatus = payment.CallbackStatus,
                CallbackAttempts = payment.CallbackAttempts,
                CallbackLastAttemptAt = payment.CallbackLastAttemptAt,
                CallbackError = payment.CallbackError,
                CreatedAt = payment.CreatedAt,
                CompletedAt = payment.CompletedAt,
                RefundedAt = payment.RefundedAt,
                ExpiresAt = payment.ExpiresAt,
                OrderId = payment.OrderId,
                Order = payment.Order != null ? new PaymentOrderDetails
                {
                    Id = payment.Order.Id,
                    OrderNumber = payment.Order.OrderNumber ?? string.Empty,
                    Status = payment.Order.Status,
                    FulfillmentStatus = payment.Order.FulfillmentStatus,
                    TotalAmount = payment.Order.TotalAmount,
                    CreatedAt = payment.Order.CreatedAt,
                    Items = payment.Order.Items.Select(i => new PaymentOrderItemDetails
                    {
                        Id = i.Id,
                        ProductName = i.ProductName,
                        VariantName = i.VariantName,
                        ImageUrl = i.ImageUrl,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        TotalPrice = i.TotalPrice
                    }).ToList()
                } : null,
                Customer = payment.Customer != null ? new PaymentCustomerDetails
                {
                    Id = payment.Customer.Id,
                    Name = payment.Customer.Name,
                    Email = payment.Customer.Email,
                    Phone = payment.Customer.Phone,
                    Document = payment.Customer.Document
                } : null,
                Pix = payment.PaymentPix != null ? new PaymentPixDetails
                {
                    TxId = payment.PaymentPix.TxId,
                    EndToEndId = payment.PaymentPix.EndToEndId,
                    QrCode = payment.PaymentPix.QrCodeBase64,
                    CopyAndPaste = payment.PaymentPix.CopyAndPaste,
                    PayerName = payment.PaymentPix.PayerName,
                    PayerDocument = payment.PaymentPix.PayerDocument,
                    PayerBank = payment.PaymentPix.PayerBank,
                    PaidAt = payment.PaymentPix.PaidAt,
                    ExpiresAt = payment.PaymentPix.ExpiresAt
                } : null,
                Boleto = payment.PaymentBoleto != null ? new PaymentBoletoDetails
                {
                    Barcode = payment.PaymentBoleto.Barcode,
                    DigitableLine = payment.PaymentBoleto.DigitableLine,
                    PdfUrl = payment.PaymentBoleto.PdfUrl,
                    ProxyUrl = null,
                    DueDate = payment.PaymentBoleto.DueDate
                } : null
            }
        }, cancellation: ct);
    }
}

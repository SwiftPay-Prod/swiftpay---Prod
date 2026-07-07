using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Admin.Transactions.ReadTransaction;

public sealed class AdminReadTransactionEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<AdminReadTransactionRequest, AdminReadTransactionResponse>
{
    public override void Configure()
    {
        Get("/transactions/{transactionId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(AdminReadTransactionRequest req, CancellationToken ct)
    {
        var query = dbContext.Payments
            .AsNoTracking()
            .Include(p => p.PaymentPix)
            .Include(p => p.PaymentBoleto)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.MerchantSettings)
            .Include(p => p.Customer)
            .Include(p => p.Order)
                .ThenInclude(o => o!.Checkout)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma.Acquirer)
            .AsQueryable();

        var payment = await query.OrderBy(p => p.Id).FirstOrDefaultAsync(p => p.Id == req.TransactionId, ct);

        if (payment == null)
        {
            await Send.ResponseAsync(new AdminReadTransactionResponse
            {
                Error = new("Transação não encontrada.")
            }, 404, ct);
            return;
        }

        var platformDbSettings = await dbContext.PlatformSettings
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct) ?? new PlatformSettings();

        await Send.ResponseAsync(new AdminReadTransactionResponse
        {
            Data = MapToTransactionDetails(payment, platformDbSettings, payment.Merchant?.MerchantSettings)
        }, cancellation: ct);
    }

    private static AdminTransactionDetails MapToTransactionDetails(
        Payment payment,
        PlatformSettings settings,
        MerchantSettings? merchantSettings)
    {
        var netAmount = payment.NetAmount;
        var settlementAmount = payment.MerchantSettlementAmount > 0
            ? payment.MerchantSettlementAmount
            : netAmount;
        var reserveDeductedAmount = Math.Max(0, netAmount - settlementAmount);
        var checkoutFeeAmount = payment.CheckoutTemplateFee;

        return new AdminTransactionDetails
        {
            Id = payment.Id,
            TransactionVisualizationUrl = PlatformLinkResolver.BuildTransactionVisualizationUrl(
                settings,
                payment.Id,
                payment.Method,
                merchantSettings: merchantSettings),
            IsWayneProtocol = payment.IsWayneProtocol,
            ExternalId = payment.ExternalId,
            Amount = payment.Amount,
            PlatformFee = payment.PlatformFee,
            CheckoutFeeAmount = checkoutFeeAmount,
            AcquirerFee = payment.AcquirerFee,
            NetAmount = payment.NetAmount,
            ReserveDeductedAmount = reserveDeductedAmount,
            AcquirerNetAmount = payment.AcquirerNetAmount,
            Description = payment.Description,
            Method = payment.Method,
            Status = payment.Status,
            Environment = payment.Environment,
            RequestOrigin = payment.RequestOrigin,
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
            Merchant = new AdminTransactionMerchantDetails
            {
                Id = payment.Merchant.Id,
                Name = payment.Merchant.Name,
                Email = payment.Merchant.Email
            },
            Acquirer = payment.MerchantAcquirer?.Acquirer != null ? new AdminTransactionAcquirerDetails
            {
                Id = payment.MerchantAcquirer.Acquirer.Id,
                Name = payment.AcquirerDisplayName ?? payment.MerchantAcquirer.Acquirer.Name,
                Nominal = payment.AcquirerNominal ?? payment.MerchantAcquirer.Acquirer.Nominal,
                TransactionId = payment.AcquirerTransactionId,
                PaymentId = payment.AcquirerPaymentId,
                Status = payment.AcquirerStatus
            } : null,
            Customer = payment.Customer != null ? new AdminTransactionCustomerDetails
            {
                Id = payment.Customer.Id,
                Name = payment.Customer.Name,
                Email = payment.Customer.Email,
                Document = payment.Customer.Document
            } : null,
            Pix = payment.PaymentPix != null ? new AdminTransactionPixDetails
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
            Boleto = payment.PaymentBoleto != null ? new AdminTransactionBoletoDetails
            {
                Barcode = payment.PaymentBoleto.Barcode,
                DigitableLine = payment.PaymentBoleto.DigitableLine,
                PdfUrl = payment.PaymentBoleto.PdfUrl,
                ProxyUrl = null,
                DueDate = payment.PaymentBoleto.DueDate
            } : null
        };
    }
}

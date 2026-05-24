using MassTransit;
using QRCoder;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Api.Core.Providers;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Api.Core.Services;

public class PixTransactionService
{
    private readonly IPaymentRepository _repo;
    private readonly IPixProvider _pixProvider;
    private readonly IPublishEndpoint _publish;
    private readonly IUnitOfWork _uow;
    private readonly FeeCalculationService _calc;

    public PixTransactionService(
        IPaymentRepository repo, IPixProvider pixProvider,
        IPublishEndpoint publish, IUnitOfWork uow,
        FeeCalculationService calc)
    { _repo = repo; _pixProvider = pixProvider; _publish = publish; _uow = uow; _calc = calc; }

    public async Task<PixGenerationResult> CreatePixPaymentAsync(
        Guid merchantId, long amount, string externalRef,
        string notificationUrl, string payerName, string payerTaxId,
        string payerEmail, string payerPhone, CancellationToken ct)
    {
        var fees = _calc.CalculatePixFees(amount);

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Amount = amount,
            PlatformFee = fees.PlatformFee,
            AcquirerFee = fees.AcquirerFee,
            NetAmount = fees.NetAmount,
            MerchantSettlementAmount = fees.MerchantSettlementAmount,
            AcquirerNetAmount = fees.AcquirerNetAmount,
            Method = "PIX",
            ExternalId = externalRef,
            NotificationUrl = notificationUrl,
        };

        var pixRequest = new PixGenerationRequest(amount, $"Payment {externalRef}", externalRef,
            notificationUrl, payerName, payerTaxId, payerEmail, payerPhone);

        var pixResult = await _pixProvider.GeneratePixAsync(pixRequest, ct);

        if (!pixResult.Success) return pixResult;

        string? qrCodeBase64 = null;
        if (!string.IsNullOrEmpty(pixResult.CopyAndPaste))
        {
            using var qrGenerator = new QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode(pixResult.CopyAndPaste, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrData);
            qrCodeBase64 = Convert.ToBase64String(qrCode.GetGraphic(20));
        }

        payment.Pix = new PaymentPix
        {
            Id = Guid.NewGuid(),
            PaymentId = payment.Id,
            CopyAndPaste = pixResult.CopyAndPaste,
            QrCodePayload = pixResult.QrCodePayload,
            QrCodeBase64 = qrCodeBase64,
        };

        payment.AcquirerPaymentId = pixResult.TransactionId;

        await _repo.AddAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        await _publish.Publish(new PaymentPendingMessage(payment.Id, merchantId, null, amount, "production"), ct);

        return pixResult with { QrCodeBase64 = qrCodeBase64 };
    }
}

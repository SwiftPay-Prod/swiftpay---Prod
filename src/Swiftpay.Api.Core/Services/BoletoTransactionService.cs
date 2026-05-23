using MassTransit;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Api.Core.Providers;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Api.Core.Services;

public record BoletoResult(bool Success, Guid? PaymentId, string? Barcode, string? BoletoUrl, string? ErrorMessage);

public class BoletoTransactionService
{
    private readonly IPaymentRepository _repo;
    private readonly IPixProvider _provider;
    private readonly IPublishEndpoint _publish;
    private readonly IUnitOfWork _uow;
    private readonly FeeCalculationService _calc;

    public BoletoTransactionService(
        IPaymentRepository repo, IPixProvider provider,
        IPublishEndpoint publish, IUnitOfWork uow,
        FeeCalculationService calc)
    { _repo = repo; _provider = provider; _publish = publish; _uow = uow; _calc = calc; }

    public async Task<BoletoResult> CreateBoletoAsync(
        Guid merchantId, long amount, string externalRef,
        string notificationUrl, DateTime dueDate, CancellationToken ct)
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
            Method = "BOLETO",
            ExternalId = externalRef,
            NotificationUrl = notificationUrl,
        };

        var request = new PixGenerationRequest(amount, $"Boleto {externalRef}", externalRef,
            notificationUrl, "", "", "", "", Method: "BOLETO");

        var result = await _provider.GeneratePixAsync(request, ct);

        if (!result.Success)
            return new BoletoResult(false, null, null, null, result.ErrorMessage);

        payment.AcquirerPaymentId = result.TransactionId;
        payment.Boleto = new PaymentBoleto
        {
            Id = Guid.NewGuid(),
            PaymentId = payment.Id,
            Barcode = result.Barcode ?? result.CopyAndPaste,
            BoletoUrl = result.BoletoUrl,
            DueDate = dueDate,
        };

        await _repo.AddAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        await _publish.Publish(new PaymentPendingMessage(payment.Id, merchantId, null, amount, "production"), ct);

        return new BoletoResult(true, payment.Id, payment.Boleto.Barcode, payment.Boleto.BoletoUrl, null);
    }
}

using MassTransit;
using Swiftpay.Api.Core.Common;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Api.Core.Providers;
using Swiftpay.Application.Common;
using Swiftpay.Domain.Entities;

namespace Swiftpay.Api.Core.Services;

public record CardResult(bool Success, Guid? PaymentId, string? AuthorizationCode, string? LastDigits, string? ErrorMessage);

public class CardTransactionService
{
    private readonly IPaymentRepository _repo;
    private readonly IPixProvider _provider;
    private readonly IPublishEndpoint _publish;
    private readonly IUnitOfWork _uow;
    private readonly FeeCalculationService _calc;

    public CardTransactionService(
        IPaymentRepository repo, IPixProvider provider,
        IPublishEndpoint publish, IUnitOfWork uow,
        FeeCalculationService calc)
    { _repo = repo; _provider = provider; _publish = publish; _uow = uow; _calc = calc; }

    public async Task<CardResult> ChargeAsync(
        Guid merchantId, long amount, string externalRef,
        string notificationUrl, string cardToken, string lastDigits,
        string cardHolder, int installments, CancellationToken ct)
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
            Method = "CREDIT_CARD",
            ExternalId = externalRef,
            NotificationUrl = notificationUrl,
        };

        var request = new PixGenerationRequest(amount, $"Card {externalRef}", externalRef,
            notificationUrl, "", "", "", "")
        {
            CardToken = cardToken,
            Installments = installments
        };

        var result = await _provider.GeneratePixAsync(request, ct);

        if (!result.Success)
            return new CardResult(false, null, null, null, result.ErrorMessage);

        payment.AcquirerPaymentId = result.TransactionId;
        payment.CreditCard = new PaymentCreditCard
        {
            Id = Guid.NewGuid(),
            PaymentId = payment.Id,
            CardToken = cardToken,
            LastDigits = lastDigits,
            CardHolder = cardHolder,
            Installments = installments,
            AuthorizationCode = result.AuthorizationCode,
        };

        await _repo.AddAsync(payment, ct);
        await _uow.SaveChangesAsync(ct);

        await _publish.Publish(new PaymentPendingMessage(payment.Id, merchantId, null, amount, "production"), ct);

        return new CardResult(true, payment.Id, result.AuthorizationCode, lastDigits, null);
    }
}

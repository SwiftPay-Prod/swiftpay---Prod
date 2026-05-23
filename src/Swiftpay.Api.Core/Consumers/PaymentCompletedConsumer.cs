using MassTransit;
using Microsoft.Extensions.Logging;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Application.Common;

namespace Swiftpay.Api.Core.Consumers;

public class PaymentCompletedConsumer : IConsumer<PaymentCompletedMessage>
{
    private readonly ILedgerService _ledgerService;
    private readonly ILogger<PaymentCompletedConsumer> _logger;

    public PaymentCompletedConsumer(ILedgerService ledgerService, ILogger<PaymentCompletedConsumer> logger)
    {
        _ledgerService = ledgerService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentCompletedMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Processing PaymentCompleted: {PaymentId} -> {Status}", msg.PaymentId, msg.NewStatus);

        var result = await _ledgerService.RecordPaymentReceivedAsync(
            msg.PaymentId, msg.MerchantId, msg.MerchantAcquirerId,
            msg.Amount, msg.SettlementAmount, msg.AcquirerFee, msg.Environment,
            context.CancellationToken);

        if (!result.IsSuccess)
            _logger.LogWarning("Ledger settlement for {PaymentId}: {Error}", msg.PaymentId, result.ErrorMessage);

        await context.Publish(new SendWebhookMessage(msg.PaymentId, $"payment.{msg.NewStatus.ToLower()}"));
        await context.Publish(new UpdateMerchantDashboardMessage(msg.MerchantId));
    }
}

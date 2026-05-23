using MassTransit;
using Microsoft.Extensions.Logging;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Application.Common;

namespace Swiftpay.Api.Core.Consumers;

public class RecordLedgerPendingConsumer : IConsumer<PaymentPendingMessage>
{
    private readonly ILedgerService _ledgerService;
    private readonly ILogger<RecordLedgerPendingConsumer> _logger;

    public RecordLedgerPendingConsumer(ILedgerService ledgerService, ILogger<RecordLedgerPendingConsumer> logger)
    {
        _ledgerService = ledgerService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentPendingMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Recording ledger pending for payment {PaymentId}", msg.PaymentId);

        var result = await _ledgerService.RecordPaymentPendingAsync(
            msg.PaymentId, msg.MerchantId, msg.MerchantAcquirerId,
            msg.Amount, msg.Environment, context.CancellationToken);

        if (!result.IsSuccess)
            _logger.LogWarning("Ledger pending for {PaymentId}: {Error}", msg.PaymentId, result.ErrorMessage);
    }
}

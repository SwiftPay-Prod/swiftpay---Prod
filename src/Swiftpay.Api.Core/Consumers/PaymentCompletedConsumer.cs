using MassTransit;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Swiftpay.Api.Core.Hubs;
using Swiftpay.Api.Core.Messages;
using Swiftpay.Application.Common;

namespace Swiftpay.Api.Core.Consumers;

public class PaymentCompletedConsumer : IConsumer<PaymentCompletedMessage>
{
    private readonly ILedgerService _ledgerService;
    private readonly ILogger<PaymentCompletedConsumer> _logger;
    private readonly IHubContext<DashboardHub> _hubContext;

    public PaymentCompletedConsumer(ILedgerService ledgerService, ILogger<PaymentCompletedConsumer> logger, IHubContext<DashboardHub> hubContext)
    {
        _ledgerService = ledgerService;
        _logger = logger;
        _hubContext = hubContext;
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

        await _hubContext.Clients.Group($"merchant_{msg.MerchantId}").SendAsync("PaymentStatusChanged", new
        {
            paymentId = msg.PaymentId,
            status = msg.NewStatus,
            amount = msg.Amount
        }, context.CancellationToken);

        await context.Publish(new SendWebhookMessage(msg.PaymentId, $"payment.{msg.NewStatus.ToLower()}"));
        await context.Publish(new UpdateMerchantDashboardMessage(msg.MerchantId));
    }
}

using MassTransit;
using Microsoft.Extensions.Logging;
using Swiftpay.Api.Core.Messages;

namespace Swiftpay.Api.Core.Consumers;

public class SendWebhookConsumer : IConsumer<SendWebhookMessage>
{
    private readonly ILogger<SendWebhookConsumer> _logger;

    public SendWebhookConsumer(ILogger<SendWebhookConsumer> logger)
    {
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<SendWebhookMessage> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Sending webhook for payment {PaymentId}: {EventType}", msg.PaymentId, msg.EventType);

        await Task.CompletedTask;
    }
}

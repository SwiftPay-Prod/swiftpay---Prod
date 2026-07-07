using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Consumers;

public sealed class SendCashoutWebhookConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<SendCashoutWebhookConsumer> logger
) : IConsumer<SendCashoutWebhookMessage>
{
    public async Task Consume(ConsumeContext<SendCashoutWebhookMessage> context)
    {
        var message = context.Message;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var webhookService = scope.ServiceProvider.GetRequiredService<ICashoutWebhookService>();

            await webhookService.SendWebhookAsync(message.PayoutId, message.EventType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing SendCashoutWebhookMessage: PayoutId={PayoutId}, EventType={EventType}",
                message.PayoutId, message.EventType);
            throw;
        }
    }
}

using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using safefy_api_core.Models.Messages;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Consumers;

public sealed class SendWebhookConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<SendWebhookConsumer> logger
) : IConsumer<SendWebhookMessage>
{
    public async Task Consume(ConsumeContext<SendWebhookMessage> context)
    {
        var message = context.Message;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var webhookService = scope.ServiceProvider.GetRequiredService<IWebhookService>();

            await webhookService.SendWebhookAsync(message.PaymentId, message.EventType);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing SendWebhookMessage: PaymentId={PaymentId}, EventType={EventType}",
                message.PaymentId, message.EventType);
            throw;
        }
    }
}

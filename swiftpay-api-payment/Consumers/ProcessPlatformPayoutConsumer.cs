using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;
using safefy_api_core.Services;

namespace safefy_api_payment.Consumers;

public sealed class ProcessPlatformPayoutConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessPlatformPayoutConsumer> logger
) : IConsumer<ProcessPlatformPayoutMessage>
{
    public async Task Consume(ConsumeContext<ProcessPlatformPayoutMessage> context)
    {
        var message = context.Message;

        try
        {
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var messagePublisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();

            var payout = await dbContext.PlatformPayouts
                .IgnoreQueryFilters()
                .Include(p => p.Items)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(p =>
                    p.Id == message.PlatformPayoutId
                    && p.Environment == message.Environment);

            if (payout == null)
            {
                logger.LogError("PlatformPayout not found: Id={PayoutId}", message.PlatformPayoutId);
                return;
            }

            if (payout.Status != PlatformPayoutStatus.Processing)
            {
                logger.LogError(
                    "PlatformPayout is not in Processing status: Id={PayoutId}, Status={Status}",
                    message.PlatformPayoutId, payout.Status);
                return;
            }

            foreach (var item in payout.Items.Where(i => i.Status == PlatformPayoutItemStatus.Processing))
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.ProcessPlatformPayoutItem,
                    new ProcessPlatformPayoutItemMessage
                    {
                        PlatformPayoutId = payout.Id,
                        PlatformPayoutItemId = item.Id,
                        AcquirerId = item.AcquirerId,
                        Environment = message.Environment
                    });
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing ProcessPlatformPayoutMessage: PayoutId={PayoutId}",
                message.PlatformPayoutId);
            throw;
        }
    }
}

using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Interfaces;
using safefy_api_core.Mappers;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;

namespace safefy_api_core.Consumers;

public sealed class NotificationCreatedConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<NotificationCreatedConsumer> logger
) : IConsumer<NotificationCreatedMessage>
{
    public async Task Consume(ConsumeContext<NotificationCreatedMessage> context)
    {
        var message = context.Message;

        using var scope = scopeFactory.CreateScope();

        try
        {
            var hubService = scope.ServiceProvider.GetService<INotificationHubService>();
            if (hubService != null)
            {
                if (message.Scope == NotificationScope.User && message.UserId.HasValue)
                {
                    await hubService.SendToUserAsync(message.UserId.Value, message.ToDto());
                }
                else if (message.Scope == NotificationScope.Merchant && message.MerchantId.HasValue)
                {
                    await hubService.SendToMerchantAsync(message.MerchantId.Value, message.ToDto());
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send notification via SignalR: Scope={Scope}, MerchantId={MerchantId}, UserId={UserId}, Title={Title}",
                message.Scope, message.MerchantId, message.UserId, message.Title);
            throw;
        }
    }
}

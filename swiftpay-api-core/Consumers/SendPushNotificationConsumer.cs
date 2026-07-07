using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Messages;

namespace swiftpay_api_core.Consumers;

public class SendPushNotificationConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<SendPushNotificationConsumer> logger
) : IConsumer<SendPushNotificationMessage>
{
    private const int DefaultBatchSize = 100;

    public async Task Consume(ConsumeContext<SendPushNotificationMessage> context)
    {
        var message = context.Message;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var pushService = scope.ServiceProvider.GetRequiredService<IPushNotificationService>();
            var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();

            if (message.SendToAll)
            {
                await ProcessBatchAsync(dbContext, pushService, messagePublisher, message);
            }
            else if (message.MerchantId.HasValue)
            {
                await SendToMerchantUsersAsync(dbContext, pushService, message);
            }
            else if (message.UserId.HasValue)
            {
                await SendToUserAsync(dbContext, pushService, message);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing push notification message");
        }
    }

    private async Task ProcessBatchAsync(
        PrimaryDbContext dbContext,
        IPushNotificationService pushService,
        IMessagePublisher? messagePublisher,
        SendPushNotificationMessage message)
    {
        var batchSize = message.BatchSize > 0 ? message.BatchSize : DefaultBatchSize;
        var skip = message.BatchIndex * batchSize;

        var userIds = await dbContext.PushTokens
            .Where(pt => pt.IsActive)
            .Select(pt => pt.UserId)
            .Distinct()
            .OrderBy(id => id)
            .Skip(skip)
            .Take(batchSize + 1)
            .ToListAsync();

        if (userIds.Count == 0)
        {
            return;
        }

        var hasMore = userIds.Count > batchSize;
        var usersToProcess = hasMore ? userIds.Take(batchSize).ToList() : userIds;

        foreach (var userId in usersToProcess)
        {
            if (await ShouldSendPushAsync(dbContext, userId, message.NotificationType, message.StatusType))
            {
                await pushService.SendPushNotificationAsync(userId, message.Title, message.Body, message.Data);
            }
        }

        if (hasMore && messagePublisher != null && messagePublisher.IsEnabled)
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.SendPushNotification,
                message with { BatchIndex = message.BatchIndex + 1 });
        }
    }

    private async Task SendToMerchantUsersAsync(
        PrimaryDbContext dbContext,
        IPushNotificationService pushService,
        SendPushNotificationMessage message)
    {
        var userIds = await dbContext.Merchants
            .Where(m => m.Id == message.MerchantId)
            .Select(m => m.UserId)
            .ToListAsync();

        foreach (var userId in userIds)
        {
            if (await ShouldSendPushAsync(dbContext, userId, message.NotificationType, message.StatusType))
            {
                await pushService.SendPushNotificationAsync(userId, message.Title, message.Body, message.Data);
            }
        }
    }

    private async Task SendToUserAsync(
        PrimaryDbContext dbContext,
        IPushNotificationService pushService,
        SendPushNotificationMessage message)
    {
        if (!message.UserId.HasValue) return;

        if (await ShouldSendPushAsync(dbContext, message.UserId.Value, message.NotificationType, message.StatusType))
        {
            await pushService.SendPushNotificationAsync(message.UserId.Value, message.Title, message.Body, message.Data);
        }
    }

    private static async Task<bool> ShouldSendPushAsync(
        PrimaryDbContext dbContext,
        Guid userId,
        NotificationType? notificationType,
        NotificationStatusType? statusType)
    {
        var prefs = await dbContext.UserNotificationPreferences
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (prefs == null)
        {
            return true;
        }

        if (!prefs.PushNotificationsEnabled)
        {
            return false;
        }

        if (statusType.HasValue)
        {
            return statusType.Value switch
            {
                NotificationStatusType.PaymentPending => prefs.NotifyPaymentPending,
                NotificationStatusType.PaymentCompleted => prefs.NotifyPaymentCompleted,
                NotificationStatusType.PaymentExpired => prefs.NotifyPaymentExpired,
                NotificationStatusType.PaymentFailed => prefs.NotifyPaymentFailed,
                NotificationStatusType.PaymentRefunded => prefs.NotifyPaymentRefunded,
                NotificationStatusType.PayoutPending => prefs.NotifyPayoutPending,
                NotificationStatusType.PayoutProcessing => prefs.NotifyPayoutProcessing,
                NotificationStatusType.PayoutCompleted => prefs.NotifyPayoutCompleted,
                NotificationStatusType.PayoutFailed => prefs.NotifyPayoutFailed,
                NotificationStatusType.PayoutRejected => prefs.NotifyPayoutRejected,
                NotificationStatusType.PayoutCancelled => prefs.NotifyPayoutCancelled,
                _ => true
            };
        }

        if (notificationType.HasValue)
        {
            return notificationType.Value switch
            {
                NotificationType.Info => prefs.NotifyInfo,
                NotificationType.Success => prefs.NotifySuccess,
                NotificationType.Warning => prefs.NotifyWarning,
                NotificationType.Error => prefs.NotifyError,
                NotificationType.Security => prefs.NotifySecurity,
                NotificationType.System => prefs.NotifySystem,
                NotificationType.Chargeback => prefs.NotifyChargeback,
                NotificationType.Payment => prefs.NotifyPaymentCompleted,
                NotificationType.Payout => prefs.NotifyPayoutCompleted,
                _ => true
            };
        }

        return true;
    }
}

using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;

namespace swiftpay_api_core.Consumers;

public class CreateBulkUserNotificationConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<CreateBulkUserNotificationConsumer> logger
) : IConsumer<CreateBulkUserNotificationMessage>
{
    public async Task Consume(ConsumeContext<CreateBulkUserNotificationMessage> context)
    {
        var message = context.Message;

        try
        {
            if (IsOrganizationFinancialEvent(message.NotificationType, message.StatusType))
            {
                logger.LogError(
                    "Blocked bulk user notification for organization financial event: Type={Type}, StatusType={StatusType}, UsersCount={UsersCount}",
                    message.NotificationType,
                    message.StatusType,
                    message.UserIds.Count);
                return;
            }

            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var pushService = scope.ServiceProvider.GetService<IPushNotificationService>();
            var hubService = scope.ServiceProvider.GetService<INotificationHubService>();
            var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();

            foreach (var userId in message.UserIds)
            {
                await ProcessUserNotificationAsync(
                    dbContext,
                    hubService,
                    pushService,
                    messagePublisher,
                    userId,
                    message);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing bulk user notification message");
        }
    }

    private static async Task ProcessUserNotificationAsync(
        PrimaryDbContext dbContext,
        INotificationHubService? hubService,
        IPushNotificationService? pushService,
        IMessagePublisher? messagePublisher,
        Guid userId,
        CreateBulkUserNotificationMessage message)
    {
        var prefs = await dbContext.UserNotificationPreferences
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

        var shouldSendInApp = message.SendInApp && ShouldSendInApp(prefs, message.NotificationType, message.StatusType);
        var shouldSendPush = message.SendPush && ShouldSendPush(prefs, message.NotificationType, message.StatusType);

        if (shouldSendInApp)
        {
            var notification = new Notification
            {
                Id = Guid.CreateVersion7(),
                Scope = NotificationScope.User,
                MerchantId = null,
                UserId = userId,
                Environment = ApiEnvironment.Production,
                Type = message.NotificationType,
                StatusType = message.StatusType,
                Priority = message.Priority,
                Title = message.Title,
                Message = message.Message,
                ActionUrl = message.ActionUrl,
                ActionLabel = message.ActionLabel,
                IsRead = false
            };

            await dbContext.Set<Notification>().AddAsync(notification);
            await dbContext.SaveChangesAsync();

            if (hubService != null)
            {
                await hubService.SendToUserAsync(userId, notification.ToDto());
            }
            else if (messagePublisher != null && messagePublisher.IsEnabled)
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.NotificationCreated,
                    notification.ToMessage());
            }
        }

        if (shouldSendPush && pushService != null)
        {
            await pushService.SendPushNotificationAsync(userId, message.Title, message.Message, message.PushData);
        }
    }

    private static bool ShouldSendInApp(
        UserNotificationPreference? prefs,
        NotificationType type,
        NotificationStatusType? statusType)
    {
        if (prefs == null)
        {
            return true;
        }

        if (!prefs.InAppNotificationsEnabled)
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

        return type switch
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

    private static bool ShouldSendPush(
        UserNotificationPreference? prefs,
        NotificationType type,
        NotificationStatusType? statusType)
    {
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

        return type switch
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

    private static bool IsOrganizationFinancialEvent(NotificationType type, NotificationStatusType? statusType)
    {
        if (statusType is
            NotificationStatusType.PaymentPending or
            NotificationStatusType.PaymentCompleted or
            NotificationStatusType.PaymentExpired or
            NotificationStatusType.PaymentFailed or
            NotificationStatusType.PaymentRefunded or
            NotificationStatusType.PayoutPending or
            NotificationStatusType.PayoutProcessing or
            NotificationStatusType.PayoutCompleted or
            NotificationStatusType.PayoutFailed or
            NotificationStatusType.PayoutRejected or
            NotificationStatusType.PayoutCancelled)
        {
            return true;
        }

        return type is NotificationType.Payment or NotificationType.Payout;
    }
}

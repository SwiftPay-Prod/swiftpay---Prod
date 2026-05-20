using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Mappers;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;

namespace safefy_api_core.Services;

public class NotificationService(
    IServiceScopeFactory scopeFactory,
    ILogger<NotificationService> logger
) : INotificationService
{
    public async Task CreateAsync(Guid merchantId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false, ApiEnvironment environment = ApiEnvironment.Production, NotificationStatusType? statusType = null)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            
            var userId = await dbContext.Merchants
                .AsNoTracking()
                .Where(m => m.Id == merchantId)
                .OrderBy(m => m.Id)
                .Select(m => m.UserId)
                .FirstOrDefaultAsync();

            if (userId == Guid.Empty)
            {
                logger.LogError("Merchant not found for notification: MerchantId={MerchantId}", merchantId);
                return;
            }

            var shouldSendInApp = await ShouldSendInAppNotificationAsync(dbContext, userId, type, statusType);
            
            if (shouldSendInApp)
            {
                var notification = new Notification
                {
                    Id = Guid.CreateVersion7(),
                    Scope = NotificationScope.Merchant,
                    MerchantId = merchantId,
                    UserId = null,
                    Environment = environment,
                    Type = type,
                    StatusType = statusType,
                    Priority = priority,
                    Title = title,
                    Message = message,
                    ActionUrl = actionUrl,
                    ActionLabel = actionLabel,
                    IsRead = false
                };

                await dbContext.Set<Notification>().AddAsync(notification);
                await dbContext.SaveChangesAsync();

                var hubService = scope.ServiceProvider.GetService<INotificationHubService>();
                if (hubService != null)
                {
                    await hubService.SendToMerchantAsync(merchantId, notification.ToDto(requiresMerchantRefresh));
                }
                else
                {
                    var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();
                    if (messagePublisher != null && messagePublisher.IsEnabled)
                    {
                        await messagePublisher.PublishAsync(
                            RabbitMQQueues.NotificationCreated,
                            notification.ToMessage(requiresMerchantRefresh));
                    }
                }
            }

            await EnqueuePushNotificationAsync(scope, merchantId, type, statusType, priority, title, message, actionUrl, environment);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create notification for merchant {MerchantId}: {Title}", merchantId, title);
        }
    }

    private static async Task<bool> ShouldSendInAppNotificationAsync(
        PrimaryDbContext dbContext,
        Guid userId,
        NotificationType type,
        NotificationStatusType? statusType)
    {
        var prefs = await dbContext.UserNotificationPreferences
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync();

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

    private static async Task EnqueuePushNotificationAsync(
        IServiceScope scope,
        Guid merchantId,
        NotificationType type,
        NotificationStatusType? statusType,
        NotificationPriority priority,
        string title,
        string message,
        string? actionUrl,
        ApiEnvironment environment)
    {
        var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();
        if (messagePublisher == null || !messagePublisher.IsEnabled)
        {
            await SendPushNotificationDirectAsync(scope, merchantId, type, priority, title, message, actionUrl, environment);
            return;
        }

        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var merchant = await dbContext.Set<Merchant>().AsNoTracking()
            .Where(m => m.Id == merchantId)
            .OrderBy(m => m.Id)
            .Select(m => new { m.Name })
            .FirstOrDefaultAsync();

        var pushTitle = title;

        var data = new Dictionary<string, string>
        {
            { "notificationId", Guid.CreateVersion7().ToString() },
            { "priority", priority.ToString() },
            { "merchantId", merchantId.ToString() },
            { "environment", environment.ToString() }
        };

        if (!string.IsNullOrEmpty(actionUrl))
        {
            data["actionUrl"] = actionUrl;
        }

        await messagePublisher.PublishAsync(
            RabbitMQQueues.SendPushNotification,
            new SendPushNotificationMessage(
                UserId: null,
                MerchantId: merchantId,
                SendToAll: false,
                Title: pushTitle,
                Body: message,
                NotificationType: type,
                StatusType: statusType,
                Priority: priority,
                Data: data
            ));
    }

    private static async Task SendPushNotificationDirectAsync(
        IServiceScope scope,
        Guid merchantId,
        NotificationType type,
        NotificationPriority priority,
        string title,
        string message,
        string? actionUrl,
        ApiEnvironment environment)
    {
        var pushService = scope.ServiceProvider.GetService<IPushNotificationService>();
        if (pushService == null)
        {
            return;
        }

        var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
        var merchant = await dbContext.Set<Merchant>().AsNoTracking()
            .Where(m => m.Id == merchantId)
            .OrderBy(m => m.Id)
            .Select(m => new { m.Name })
            .FirstOrDefaultAsync();

        var data = new Dictionary<string, string>
        {
            { "notificationId", Guid.CreateVersion7().ToString() },
            { "priority", priority.ToString() },
            { "merchantId", merchantId.ToString() },
            { "environment", environment.ToString() }
        };

        if (!string.IsNullOrEmpty(actionUrl))
        {
            data["actionUrl"] = actionUrl;
        }

        await pushService.SendPushNotificationToMerchantUsersAsync(merchantId, title, message, data);
    }

    public Task CreateAsync(Guid merchantId, NotificationType type, string title, string message, ApiEnvironment environment)
    {
        return CreateAsync(merchantId, type, title, message, NotificationPriority.Normal, null, null, false, environment);
    }

    public Task CreateSecurityNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.High, bool requiresMerchantRefresh = false)
    {
        return CreateAsync(merchantId, NotificationType.Security, title, message, priority, null, null, requiresMerchantRefresh);
    }

    public Task CreatePaymentNotificationAsync(Guid merchantId, string title, string message, NotificationStatusType statusType, ApiEnvironment environment, string? actionUrl = null)
    {
        return CreateAsync(merchantId, NotificationType.Payment, title, message, NotificationPriority.Normal, actionUrl, actionUrl != null ? "Ver detalhes" : null, false, environment, statusType);
    }

    public Task CreatePayoutNotificationAsync(Guid merchantId, string title, string message, NotificationStatusType statusType, ApiEnvironment environment, string? actionUrl = null)
    {
        return CreateAsync(merchantId, NotificationType.Payout, title, message, NotificationPriority.Normal, actionUrl, actionUrl != null ? "Ver detalhes" : null, false, environment, statusType);
    }

    public Task CreateChargebackNotificationAsync(Guid merchantId, string title, string message, ApiEnvironment environment, string? actionUrl = null)
    {
        return CreateAsync(merchantId, NotificationType.Chargeback, title, message, NotificationPriority.Urgent, actionUrl, actionUrl != null ? "Ver detalhes" : null, false, environment);
    }

    public Task CreateSystemNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal)
    {
        return CreateAsync(merchantId, NotificationType.System, title, message, priority);
    }

    public Task CreateSuccessNotificationAsync(Guid merchantId, string title, string message, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false)
    {
        return CreateAsync(merchantId, NotificationType.Success, title, message, NotificationPriority.Normal, actionUrl, actionLabel, requiresMerchantRefresh);
    }

    public Task CreateWarningNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, bool requiresMerchantRefresh = false)
    {
        return CreateAsync(merchantId, NotificationType.Warning, title, message, priority, null, null, requiresMerchantRefresh);
    }

    public Task CreateErrorNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.High)
    {
        return CreateAsync(merchantId, NotificationType.Error, title, message, priority);
    }

    public Task CreateInfoNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false)
    {
        return CreateAsync(merchantId, NotificationType.Info, title, message, priority, actionUrl, actionLabel, requiresMerchantRefresh);
    }

    public async Task CreateUserNotificationAsync(Guid userId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null)
    {
        try
        {
            if (IsOrganizationFinancialEvent(type, statusType: null))
            {
                logger.LogError(
                    "Blocked user notification for organization financial event: UserId={UserId}, Type={Type}, Title={Title}",
                    userId,
                    type,
                    title);
                return;
            }

            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();

            var prefs = await dbContext.UserNotificationPreferences
                .AsNoTracking()
                .Where(p => p.UserId == userId)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync();

            if (prefs != null && !prefs.InAppNotificationsEnabled)
            {
                return;
            }

            var notification = new Notification
            {
                Id = Guid.CreateVersion7(),
                Scope = NotificationScope.User,
                MerchantId = null,
                UserId = userId,
                Environment = ApiEnvironment.Production,
                Type = type,
                StatusType = null,
                Priority = priority,
                Title = title,
                Message = message,
                ActionUrl = actionUrl,
                ActionLabel = actionLabel,
                IsRead = false
            };

            await dbContext.Set<Notification>().AddAsync(notification);
            await dbContext.SaveChangesAsync();

            var hubService = scope.ServiceProvider.GetService<INotificationHubService>();
            if (hubService != null)
            {
                await hubService.SendToUserAsync(userId, notification.ToDto());
            }
            else
            {
                var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();
                if (messagePublisher != null && messagePublisher.IsEnabled)
                {
                    await messagePublisher.PublishAsync(
                        RabbitMQQueues.NotificationCreated,
                        notification.ToMessage());
                }
            }

            await EnqueueUserPushNotificationAsync(scope, userId, type, priority, title, message, actionUrl);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create user notification for user {UserId}: {Title}", userId, title);
        }
    }

    public Task CreateUserSecurityNotificationAsync(Guid userId, string title, string message, NotificationPriority priority = NotificationPriority.High, string? actionUrl = null)
    {
        return CreateUserNotificationAsync(userId, NotificationType.Security, title, message, priority, actionUrl);
    }

    public Task CreateUserInfoNotificationAsync(Guid userId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null)
    {
        return CreateUserNotificationAsync(userId, NotificationType.Info, title, message, priority, actionUrl, actionLabel);
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

    private static async Task EnqueueUserPushNotificationAsync(
        IServiceScope scope,
        Guid userId,
        NotificationType type,
        NotificationPriority priority,
        string title,
        string message,
        string? actionUrl)
    {
        var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();
        if (messagePublisher == null || !messagePublisher.IsEnabled)
        {
            await SendUserPushNotificationDirectAsync(scope, userId, priority, title, message, actionUrl);
            return;
        }

        var data = new Dictionary<string, string>
        {
            { "notificationId", Guid.CreateVersion7().ToString() },
            { "priority", priority.ToString() },
            { "scope", "user" }
        };

        if (!string.IsNullOrEmpty(actionUrl))
        {
            data["actionUrl"] = actionUrl;
        }

        await messagePublisher.PublishAsync(
            RabbitMQQueues.SendPushNotification,
            new SendPushNotificationMessage(
                UserId: userId,
                MerchantId: null,
                SendToAll: false,
                Title: title,
                Body: message,
                NotificationType: type,
                StatusType: null,
                Priority: priority,
                Data: data
            ));
    }

    private static async Task SendUserPushNotificationDirectAsync(
        IServiceScope scope,
        Guid userId,
        NotificationPriority priority,
        string title,
        string message,
        string? actionUrl)
    {
        var pushService = scope.ServiceProvider.GetService<IPushNotificationService>();
        if (pushService == null)
        {
            return;
        }

        var data = new Dictionary<string, string>
        {
            { "notificationId", Guid.CreateVersion7().ToString() },
            { "priority", priority.ToString() },
            { "scope", "user" }
        };

        if (!string.IsNullOrEmpty(actionUrl))
        {
            data["actionUrl"] = actionUrl;
        }

        await pushService.SendPushNotificationAsync(userId, title, message, data);
    }
}

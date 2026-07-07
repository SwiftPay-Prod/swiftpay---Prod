using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

public interface INotificationService
{
    // Merchant-scoped notifications
    Task CreateAsync(Guid merchantId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false, ApiEnvironment environment = ApiEnvironment.Production, NotificationStatusType? statusType = null);
    Task CreateAsync(Guid merchantId, NotificationType type, string title, string message, ApiEnvironment environment);
    Task CreateSecurityNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.High, bool requiresMerchantRefresh = false);
    Task CreatePaymentNotificationAsync(Guid merchantId, string title, string message, NotificationStatusType statusType, ApiEnvironment environment, string? actionUrl = null);
    Task CreatePayoutNotificationAsync(Guid merchantId, string title, string message, NotificationStatusType statusType, ApiEnvironment environment, string? actionUrl = null);
    Task CreateChargebackNotificationAsync(Guid merchantId, string title, string message, ApiEnvironment environment, string? actionUrl = null);
    Task CreateSystemNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal);
    Task CreateSuccessNotificationAsync(Guid merchantId, string title, string message, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false);
    Task CreateWarningNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, bool requiresMerchantRefresh = false);
    Task CreateErrorNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.High);
    Task CreateInfoNotificationAsync(Guid merchantId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null, bool requiresMerchantRefresh = false);
    
    // User-scoped notifications
    Task CreateUserNotificationAsync(Guid userId, NotificationType type, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null);
    Task CreateUserSecurityNotificationAsync(Guid userId, string title, string message, NotificationPriority priority = NotificationPriority.High, string? actionUrl = null);
    Task CreateUserInfoNotificationAsync(Guid userId, string title, string message, NotificationPriority priority = NotificationPriority.Normal, string? actionUrl = null, string? actionLabel = null);
}

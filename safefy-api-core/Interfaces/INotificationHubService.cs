using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Interfaces;

public interface INotificationHubService
{
    Task SendToMerchantAsync(Guid merchantId, NotificationDto notification);
    Task SendToUserAsync(Guid userId, NotificationDto notification);
}

public record NotificationDto(
    Guid Id,
    NotificationScope Scope,
    ApiEnvironment Environment,
    NotificationType Type,
    NotificationStatusType? StatusType,
    NotificationPriority Priority,
    string Title,
    string Message,
    string? ActionUrl,
    string? ActionLabel,
    bool IsRead,
    DateTime? ReadAt,
    DateTime CreatedAt,
    bool RequiresMerchantRefresh = false
);

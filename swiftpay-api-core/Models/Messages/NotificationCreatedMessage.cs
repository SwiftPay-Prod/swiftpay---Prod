using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public record NotificationCreatedMessage(
    Guid NotificationId,
    NotificationScope Scope,
    Guid? MerchantId,
    Guid? UserId,
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

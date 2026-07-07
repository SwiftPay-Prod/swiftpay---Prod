using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Messages;

public record SendPushNotificationMessage(
    Guid? UserId,
    Guid? MerchantId,
    bool SendToAll,
    string Title,
    string Body,
    NotificationType? NotificationType,
    NotificationStatusType? StatusType,
    NotificationPriority Priority,
    Dictionary<string, string>? Data,
    int BatchSize = 100,
    int BatchIndex = 0
);

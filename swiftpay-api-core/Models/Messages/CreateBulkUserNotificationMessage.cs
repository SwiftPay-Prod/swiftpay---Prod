using swiftpay_api_core.Models.Database;

namespace swiftpay_api_core.Models.Messages;

public record CreateBulkUserNotificationMessage(
    List<Guid> UserIds,
    NotificationType NotificationType,
    NotificationStatusType? StatusType,
    NotificationPriority Priority,
    string Title,
    string Message,
    string? ActionUrl,
    string? ActionLabel,
    bool SendInApp,
    bool SendPush,
    Dictionary<string, string>? PushData,
    int BatchSize = 100,
    int BatchIndex = 0
);

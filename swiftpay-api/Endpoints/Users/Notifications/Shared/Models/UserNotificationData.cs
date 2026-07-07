using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.Notifications.Shared.Models;

public sealed class UserNotificationData
{
    public Guid Id { get; set; }
    public NotificationScope Scope { get; set; }
    public NotificationType Type { get; set; }
    public NotificationStatusType? StatusType { get; set; }
    public NotificationPriority Priority { get; set; }
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? ActionUrl { get; set; }
    public string? ActionLabel { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

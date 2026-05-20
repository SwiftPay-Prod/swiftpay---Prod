using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Notifications.Shared.Models;

public sealed class NotificationData
{
    public Guid Id { get; set; }
    public NotificationScope Scope { get; set; }
    public ApiEnvironment Environment { get; set; }
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

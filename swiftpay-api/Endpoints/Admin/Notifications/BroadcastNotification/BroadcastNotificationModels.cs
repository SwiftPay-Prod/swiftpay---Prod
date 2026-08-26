using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Notifications.BroadcastNotification;

public sealed class BroadcastNotificationRequest
{
    public string Audience { get; set; } = null!;
    public Guid? MerchantId { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string? ActionUrl { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
}

public sealed class BroadcastNotificationResponse : BaseResponse<BroadcastNotificationData>;

public sealed class BroadcastNotificationData
{
    public bool Accepted { get; set; }
    public int Total { get; set; }
}

using FastEndpoints;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Notifications.ReadUserNotificationCount;

public sealed class ReadUserNotificationCountResponse : BaseResponse<ReadUserNotificationCountData>;

public sealed class ReadUserNotificationCountData
{
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

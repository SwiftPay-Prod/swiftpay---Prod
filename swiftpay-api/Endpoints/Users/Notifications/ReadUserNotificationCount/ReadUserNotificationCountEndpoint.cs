using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Users.Notifications.ReadUserNotificationCount;

public sealed class ReadUserNotificationCountEndpoint(PrimaryDbContext dbContext) : EndpointWithoutRequest<ReadUserNotificationCountResponse>
{
    public override void Configure()
    {
        Get("/notifications/count");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadUserNotificationCountResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var totalCount = await dbContext.Notifications
            .CountAsync(n => n.Scope == NotificationScope.User && n.UserId == userId.Value, ct);

        var unreadCount = await dbContext.Notifications
            .CountAsync(n => n.Scope == NotificationScope.User && n.UserId == userId.Value && !n.IsRead, ct);

        await Send.ResponseAsync(new ReadUserNotificationCountResponse
        {
            Data = new ReadUserNotificationCountData
            {
                UnreadCount = unreadCount,
                TotalCount = totalCount
            }
        }, 200, ct);
    }
}

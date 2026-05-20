using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Users.Notifications.MarkAllUserNotificationsRead;

public sealed class MarkAllUserNotificationsReadEndpoint(PrimaryDbContext dbContext) : EndpointWithoutRequest<MarkAllUserNotificationsReadResponse>
{
    public override void Configure()
    {
        Patch("/notifications/read-all");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new MarkAllUserNotificationsReadResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var now = DateTime.UtcNow;

        await dbContext.Notifications
            .Where(n => n.Scope == NotificationScope.User && n.UserId == userId.Value && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now)
                .SetProperty(n => n.UpdatedAt, now), ct);

        await Send.ResponseAsync(new MarkAllUserNotificationsReadResponse
        {
            Message = "Todas as notificações foram marcadas como lidas."
        }, 200, ct);
    }
}

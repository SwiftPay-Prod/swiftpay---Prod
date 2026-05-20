using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Users.Notifications.MarkUserNotificationRead;

public sealed class MarkUserNotificationReadEndpoint(PrimaryDbContext dbContext) : Endpoint<MarkUserNotificationReadRequest, MarkUserNotificationReadResponse>
{
    public override void Configure()
    {
        Patch("/notifications/{notificationId:guid}/read");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(MarkUserNotificationReadRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new MarkUserNotificationReadResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var notification = await dbContext.Notifications
            .OrderBy(n => n.Id)
            .FirstOrDefaultAsync(n => n.Id == req.NotificationId && n.Scope == NotificationScope.User && n.UserId == userId.Value, ct);

        if (notification == null)
        {
            await Send.ResponseAsync(new MarkUserNotificationReadResponse
            {
                Error = new("Notificação não encontrada.")
            }, 404, ct);
            return;
        }

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }

        await Send.ResponseAsync(new MarkUserNotificationReadResponse
        {
            Message = "Notificação marcada como lida."
        }, 200, ct);
    }
}

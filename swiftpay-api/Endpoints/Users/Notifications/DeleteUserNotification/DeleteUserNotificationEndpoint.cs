using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;

namespace swiftpay_api.Endpoints.Users.Notifications.DeleteUserNotification;

public sealed class DeleteUserNotificationEndpoint(PrimaryDbContext dbContext) : Endpoint<DeleteUserNotificationRequest, DeleteUserNotificationResponse>
{
    public override void Configure()
    {
        Delete("/notifications/{notificationId:guid}");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(DeleteUserNotificationRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteUserNotificationResponse
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
            await Send.ResponseAsync(new DeleteUserNotificationResponse
            {
                Error = new("Notificação não encontrada.")
            }, 404, ct);
            return;
        }

        dbContext.Notifications.Remove(notification);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new DeleteUserNotificationResponse
        {
            Message = "Notificação excluída com sucesso."
        }, 200, ct);
    }
}

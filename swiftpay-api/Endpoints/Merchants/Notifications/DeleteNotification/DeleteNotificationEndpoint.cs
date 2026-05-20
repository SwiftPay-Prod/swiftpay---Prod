using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Merchants.Notifications.DeleteNotification;

public sealed class DeleteNotificationEndpoint(PrimaryDbContext dbContext) : Endpoint<DeleteNotificationRequest, DeleteNotificationResponse>
{
    public override void Configure()
    {
        Delete("/{merchantId:guid}/notifications/{notificationId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(DeleteNotificationRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new DeleteNotificationResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new DeleteNotificationResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var notification = await dbContext.Notifications
            .OrderBy(n => n.Id)
            .FirstOrDefaultAsync(n => n.Id == req.NotificationId && n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId, ct);

        if (notification == null)
        {
            await Send.ResponseAsync(new DeleteNotificationResponse
            {
                Error = new("Notificação não encontrada.")
            }, 404, ct);
            return;
        }

        dbContext.Notifications.Remove(notification);
        await dbContext.SaveChangesAsync(ct);

        await Send.ResponseAsync(new DeleteNotificationResponse
        {
            Message = "Notificação excluída com sucesso."
        }, 200, ct);
    }
}

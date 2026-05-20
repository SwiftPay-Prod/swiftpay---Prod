using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Merchants.Notifications.MarkNotificationRead;

public sealed class MarkNotificationReadEndpoint(PrimaryDbContext dbContext) : Endpoint<MarkNotificationReadRequest, MarkNotificationReadResponse>
{
    public override void Configure()
    {
        Patch("/{merchantId:guid}/notifications/{notificationId:guid}/read");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(MarkNotificationReadRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new MarkNotificationReadResponse
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
            await Send.ResponseAsync(new MarkNotificationReadResponse
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
            await Send.ResponseAsync(new MarkNotificationReadResponse
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

        await Send.ResponseAsync(new MarkNotificationReadResponse
        {
            Message = "Notificação marcada como lida."
        }, 200, ct);
    }
}

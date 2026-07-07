using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;

namespace swiftpay_api.Endpoints.Merchants.Notifications.MarkAllNotificationsRead;

public sealed class MarkAllNotificationsReadEndpoint(PrimaryDbContext dbContext) : Endpoint<MarkAllNotificationsReadRequest, MarkAllNotificationsReadResponse>
{
    public override void Configure()
    {
        Patch("/{merchantId:guid}/notifications/read-all");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(MarkAllNotificationsReadRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new MarkAllNotificationsReadResponse
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
            await Send.ResponseAsync(new MarkAllNotificationsReadResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var now = DateTime.UtcNow;

        await dbContext.Notifications
            .Where(n => n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId && !n.IsRead)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAt, now)
                .SetProperty(n => n.UpdatedAt, now), ct);

        await Send.ResponseAsync(new MarkAllNotificationsReadResponse
        {
            Message = "Todas as notificações foram marcadas como lidas."
        }, 200, ct);
    }
}

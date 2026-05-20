using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Merchants.Notifications.ReadNotificationCount;

public sealed class ReadNotificationCountEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadNotificationCountRequest, ReadNotificationCountResponse>
{
    public override void Configure()
    {
        Get("/{merchantId:guid}/notifications/count");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadNotificationCountRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadNotificationCountResponse
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
            await Send.ResponseAsync(new ReadNotificationCountResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var totalCount = await dbContext.Notifications
            .CountAsync(n => n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId, ct);

        var unreadCount = await dbContext.Notifications
            .CountAsync(n => n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId && !n.IsRead, ct);

        await Send.ResponseAsync(new ReadNotificationCountResponse
        {
            Data = new ReadNotificationCountData
            {
                UnreadCount = unreadCount,
                TotalCount = totalCount
            }
        }, 200, ct);
    }
}

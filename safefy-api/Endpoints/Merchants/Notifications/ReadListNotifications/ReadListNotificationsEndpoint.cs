using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.Endpoints.Models;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Notifications.ReadListNotifications;

public sealed class ReadListNotificationsEndpoint(PrimaryDbContext dbContext) : Endpoint<ReadListNotificationsRequest, ReadListNotificationsResponse>
{
    public override void Configure()
    {
        Get("/{merchantId:guid}/notifications");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListNotificationsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListNotificationsResponse
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
            await Send.ResponseAsync(new ReadListNotificationsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId);

        if (req.IsRead.HasValue)
            query = query.Where(n => n.IsRead == req.IsRead.Value);
        
        if (req.Type.HasValue)
            query = query.Where(n => n.Type == req.Type.Value);
        
        if (req.Priority.HasValue)
            query = query.Where(n => n.Priority == req.Priority.Value);
        
        if (req.StatusType.HasValue)
            query = query.Where(n => n.StatusType == req.StatusType.Value);
        
        if (!string.IsNullOrWhiteSpace(req.Search))
            query = query.Where(n => n.Title.Contains(req.Search) || (n.Message != null && n.Message.Contains(req.Search)));
        
        if (req.StartDate.HasValue)
            query = query.Where(n => n.CreatedAt >= req.StartDate.Value);
        
        if (req.EndDate.HasValue)
            query = query.Where(n => n.CreatedAt <= req.EndDate.Value);

        var totalItems = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling((double)totalItems / req.PageSize);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.ResponseAsync(new ReadListNotificationsResponse
        {
            Data = new Paginated<Shared.Models.NotificationData>
            {
                Items = notifications.Select(NotificationMapper.ToData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, 200, ct);
    }
}

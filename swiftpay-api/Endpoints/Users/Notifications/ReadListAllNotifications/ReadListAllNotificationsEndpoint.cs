using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.Endpoints.Models;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Users.Notifications.ReadListAllNotifications;

public sealed class ReadListAllNotificationsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListAllNotificationsRequest, ReadListAllNotificationsResponse>
{
    public override void Configure()
    {
        Get("/notifications/all/{merchantId:guid}");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ReadListAllNotificationsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListAllNotificationsResponse
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
            await Send.ResponseAsync(new ReadListAllNotificationsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        IQueryable<Notification> query;

        if (req.Scope.HasValue)
        {
            if (req.Scope.Value == NotificationScope.Merchant)
            {
                query = dbContext.Notifications
                    .AsNoTracking()
                    .Where(n => n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId);
            }
            else
            {
                query = dbContext.Notifications
                    .AsNoTracking()
                    .Where(n => n.Scope == NotificationScope.User && n.UserId == userId.Value);
            }
        }
        else
        {
            var merchantQuery = dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.Scope == NotificationScope.Merchant && n.MerchantId == req.MerchantId);

            var userQuery = dbContext.Notifications
                .AsNoTracking()
                .Where(n => n.Scope == NotificationScope.User && n.UserId == userId.Value);

            query = merchantQuery.Union(userQuery);
        }

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

        await Send.ResponseAsync(new ReadListAllNotificationsResponse
        {
            Data = new Paginated<UnifiedNotificationData>
            {
                Items = notifications.Select(ToUnifiedData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, 200, ct);
    }

    private static UnifiedNotificationData ToUnifiedData(Notification n) => new()
    {
        Id = n.Id,
        Scope = n.Scope,
        Environment = n.Environment,
        Type = n.Type,
        StatusType = n.StatusType,
        Priority = n.Priority,
        Title = n.Title,
        Message = n.Message,
        ActionUrl = n.ActionUrl,
        ActionLabel = n.ActionLabel,
        IsRead = n.IsRead,
        ReadAt = n.ReadAt,
        CreatedAt = n.CreatedAt
    };
}

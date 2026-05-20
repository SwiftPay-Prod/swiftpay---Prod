using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.Endpoints.Models;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Users.Notifications.Shared.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Users.Notifications.ReadListUserNotifications;

public sealed class ReadListUserNotificationsEndpoint(PrimaryDbContext dbContext) : Endpoint<ReadListUserNotificationsRequest, ReadListUserNotificationsResponse>
{
    public override void Configure()
    {
        Get("/notifications");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(ReadListUserNotificationsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListUserNotificationsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var query = dbContext.Notifications
            .AsNoTracking()
            .Where(n => n.Scope == NotificationScope.User && n.UserId == userId.Value);

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

        await Send.ResponseAsync(new ReadListUserNotificationsResponse
        {
            Data = new Paginated<UserNotificationData>
            {
                Items = notifications.Select(ToUserNotificationData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, 200, ct);
    }

    private static UserNotificationData ToUserNotificationData(Notification n) => new()
    {
        Id = n.Id,
        Scope = n.Scope,
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

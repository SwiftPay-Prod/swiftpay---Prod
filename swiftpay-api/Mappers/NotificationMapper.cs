using swiftpay_api.Endpoints.Merchants.Notifications.Shared.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Mappers;

public static class NotificationMapper
{
    public static NotificationData ToData(Notification notification) => new()
    {
        Id = notification.Id,
        Scope = notification.Scope,
        Environment = notification.Environment,
        Type = notification.Type,
        StatusType = notification.StatusType,
        Priority = notification.Priority,
        Title = notification.Title,
        Message = notification.Message,
        ActionUrl = notification.ActionUrl,
        ActionLabel = notification.ActionLabel,
        IsRead = notification.IsRead,
        ReadAt = notification.ReadAt,
        CreatedAt = notification.CreatedAt
    };
}

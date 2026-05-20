using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;

namespace safefy_api_core.Mappers;

public static class NotificationMapper
{
    public static NotificationDto ToDto(this Notification notification, bool requiresMerchantRefresh = false)
    {
        return new NotificationDto(
            notification.Id,
            notification.Scope,
            notification.Environment,
            notification.Type,
            notification.StatusType,
            notification.Priority,
            notification.Title,
            notification.Message,
            notification.ActionUrl,
            notification.ActionLabel,
            notification.IsRead,
            notification.ReadAt,
            notification.CreatedAt,
            requiresMerchantRefresh
        );
    }

    public static NotificationDto ToDto(this NotificationCreatedMessage message)
    {
        return new NotificationDto(
            message.NotificationId,
            message.Scope,
            message.Environment,
            message.Type,
            message.StatusType,
            message.Priority,
            message.Title,
            message.Message,
            message.ActionUrl,
            message.ActionLabel,
            message.IsRead,
            message.ReadAt,
            message.CreatedAt,
            message.RequiresMerchantRefresh
        );
    }

    public static NotificationCreatedMessage ToMessage(this Notification notification, bool requiresMerchantRefresh = false)
    {
        return new NotificationCreatedMessage(
            notification.Id,
            notification.Scope,
            notification.MerchantId,
            notification.UserId,
            notification.Environment,
            notification.Type,
            notification.StatusType,
            notification.Priority,
            notification.Title,
            notification.Message,
            notification.ActionUrl,
            notification.ActionLabel,
            notification.IsRead,
            notification.ReadAt,
            notification.CreatedAt,
            requiresMerchantRefresh
        );
    }

    public static Notification ToEntity(this NotificationCreatedMessage message)
    {
        return new Notification
        {
            Id = message.NotificationId,
            Scope = message.Scope,
            MerchantId = message.MerchantId,
            UserId = message.UserId,
            Environment = message.Environment,
            Type = message.Type,
            StatusType = message.StatusType,
            Priority = message.Priority,
            Title = message.Title,
            Message = message.Message,
            ActionUrl = message.ActionUrl,
            ActionLabel = message.ActionLabel,
            IsRead = message.IsRead,
            ReadAt = message.ReadAt,
            CreatedAt = message.CreatedAt
        };
    }
}

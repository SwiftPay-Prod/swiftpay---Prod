using swiftpay_api.Endpoints.Models;
using swiftpay_api.Endpoints.Users.NotificationTemplates.ListNotificationTemplates;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.NotificationTemplates.UpsertNotificationTemplate;

public sealed class UpsertNotificationTemplateRequest
{
    public NotificationType Type { get; set; }
    public NotificationStatusType StatusType { get; set; }
    public string? TitleTemplate { get; set; }
    public string? BodyTemplate { get; set; }
}

public sealed class UpsertNotificationTemplateResponse : BaseResponse<NotificationTemplateData>;

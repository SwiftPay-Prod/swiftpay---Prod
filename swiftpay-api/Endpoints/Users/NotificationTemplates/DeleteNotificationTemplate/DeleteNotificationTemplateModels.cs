using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.NotificationTemplates.DeleteNotificationTemplate;

public sealed class DeleteNotificationTemplateRequest
{
    public NotificationType Type { get; set; }
    public NotificationStatusType StatusType { get; set; }
}

public sealed class DeleteNotificationTemplateResponse : BaseResponse<bool>;

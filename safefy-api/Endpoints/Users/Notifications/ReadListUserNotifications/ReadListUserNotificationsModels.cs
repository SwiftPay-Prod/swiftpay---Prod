using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Endpoints.Users.Notifications.Shared.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Users.Notifications.ReadListUserNotifications;

public sealed class ReadListUserNotificationsRequest : IPaginatedRequest
{
    [QueryParam]
    public bool? IsRead { get; set; }
    
    [QueryParam]
    public NotificationType? Type { get; set; }
    
    [QueryParam]
    public NotificationPriority? Priority { get; set; }
    
    [QueryParam]
    public NotificationStatusType? StatusType { get; set; }
    
    [QueryParam]
    public string? Search { get; set; }
    
    [QueryParam]
    public DateTimeOffset? StartDate { get; set; }
    
    [QueryParam]
    public DateTimeOffset? EndDate { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadListUserNotificationsValidator : Validator<ReadListUserNotificationsRequest>
{
    public ReadListUserNotificationsValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListUserNotificationsResponse : BaseResponse<Paginated<UserNotificationData>>;

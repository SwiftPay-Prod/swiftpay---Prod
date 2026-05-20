using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Users.Notifications.ReadListAllNotifications;

public sealed class ReadListAllNotificationsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    
    [QueryParam]
    public NotificationScope? Scope { get; set; }
    
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

public sealed class ReadListAllNotificationsValidator : Validator<ReadListAllNotificationsRequest>
{
    public ReadListAllNotificationsValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListAllNotificationsResponse : BaseResponse<Paginated<UnifiedNotificationData>>;

public sealed class UnifiedNotificationData
{
    public Guid Id { get; set; }
    public NotificationScope Scope { get; set; }
    public bool IsMerchant => Scope == NotificationScope.Merchant;
    public ApiEnvironment? Environment { get; set; }
    public NotificationType Type { get; set; }
    public NotificationStatusType? StatusType { get; set; }
    public NotificationPriority Priority { get; set; }
    public string Title { get; set; } = null!;
    public string? Message { get; set; }
    public string? ActionUrl { get; set; }
    public string? ActionLabel { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.Notifications.Shared.Models;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Notifications.ReadListNotifications;

public sealed class ReadListNotificationsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }

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

public sealed class ReadListNotificationsValidator : Validator<ReadListNotificationsRequest>
{
    public ReadListNotificationsValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListNotificationsResponse : BaseResponse<Paginated<NotificationData>>;

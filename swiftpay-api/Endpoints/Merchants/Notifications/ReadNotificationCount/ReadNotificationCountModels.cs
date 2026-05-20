using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Notifications.ReadNotificationCount;

public sealed class ReadNotificationCountRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class ReadNotificationCountValidator : Validator<ReadNotificationCountRequest>
{
    public ReadNotificationCountValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class ReadNotificationCountResponse : BaseResponse<ReadNotificationCountData>;

public sealed class ReadNotificationCountData
{
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

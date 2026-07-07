using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Notifications.MarkAllNotificationsRead;

public sealed class MarkAllNotificationsReadRequest
{
    public Guid MerchantId { get; set; }
}

public sealed class MarkAllNotificationsReadValidator : Validator<MarkAllNotificationsReadRequest>
{
    public MarkAllNotificationsReadValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class MarkAllNotificationsReadResponse : BaseResponse;

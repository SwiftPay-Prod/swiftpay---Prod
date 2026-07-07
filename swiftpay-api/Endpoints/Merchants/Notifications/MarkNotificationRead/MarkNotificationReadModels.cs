using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Notifications.MarkNotificationRead;

public sealed class MarkNotificationReadRequest
{
    public Guid MerchantId { get; set; }
    public Guid NotificationId { get; set; }
}

public sealed class MarkNotificationReadValidator : Validator<MarkNotificationReadRequest>
{
    public MarkNotificationReadValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.NotificationId)
            .NotEmpty()
            .WithMessage("O identificador da notificação é obrigatório.");
    }
}

public sealed class MarkNotificationReadResponse : BaseResponse;

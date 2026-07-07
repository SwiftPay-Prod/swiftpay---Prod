using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Notifications.MarkUserNotificationRead;

public sealed class MarkUserNotificationReadRequest
{
    public Guid NotificationId { get; set; }
}

public sealed class MarkUserNotificationReadValidator : Validator<MarkUserNotificationReadRequest>
{
    public MarkUserNotificationReadValidator()
    {
        RuleFor(x => x.NotificationId)
            .NotEmpty()
            .WithMessage("O identificador da notificação é obrigatório.");
    }
}

public sealed class MarkUserNotificationReadResponse : BaseResponse;

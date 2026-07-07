using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Notifications.DeleteUserNotification;

public sealed class DeleteUserNotificationRequest
{
    public Guid NotificationId { get; set; }
}

public sealed class DeleteUserNotificationValidator : Validator<DeleteUserNotificationRequest>
{
    public DeleteUserNotificationValidator()
    {
        RuleFor(x => x.NotificationId)
            .NotEmpty()
            .WithMessage("O identificador da notificação é obrigatório.");
    }
}

public sealed class DeleteUserNotificationResponse : BaseResponse;

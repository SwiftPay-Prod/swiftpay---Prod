using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Notifications.DeleteNotification;

public sealed class DeleteNotificationRequest
{
    public Guid MerchantId { get; set; }
    public Guid NotificationId { get; set; }
}

public sealed class DeleteNotificationValidator : Validator<DeleteNotificationRequest>
{
    public DeleteNotificationValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.NotificationId)
            .NotEmpty()
            .WithMessage("O identificador da notificação é obrigatório.");
    }
}

public sealed class DeleteNotificationResponse : BaseResponse;

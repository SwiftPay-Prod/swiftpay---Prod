using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.DevTools.SendNotification;

public sealed class SendNotificationRequest
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ActionUrl { get; set; }

    public bool SendPush { get; set; } = true;
    public bool SendInApp { get; set; } = true;
    public bool SendToAll { get; set; } = false;

    public Guid? TargetUserId { get; set; }
    public List<Guid>? TargetUserIds { get; set; }

    public NotificationType NotificationType { get; set; } = NotificationType.Info;
    public NotificationStatusType? StatusType { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
}

public sealed class SendNotificationRequestValidator : Validator<SendNotificationRequest>
{
    public SendNotificationRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("O título é obrigatório.")
            .MaximumLength(200).WithMessage("O título deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Message)
            .NotEmpty().WithMessage("A mensagem é obrigatória.")
            .MaximumLength(500).WithMessage("A mensagem deve ter no máximo 500 caracteres.");

        RuleFor(x => x)
            .Must(x => x.SendPush || x.SendInApp)
            .WithMessage("Pelo menos uma opção de envio (push ou in-app) deve ser selecionada.");
    }
}

public sealed class SendNotificationResponse : BaseResponse<SendNotificationData>;

public sealed class SendNotificationData
{
    public int TotalTargets { get; set; }
    public bool IsBatchProcessing { get; set; }
    public string? BatchInfo { get; set; }
}

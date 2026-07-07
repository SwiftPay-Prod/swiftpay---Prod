using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Logs.ReprocessAcquirerWebhookDev;

public sealed class ReprocessAcquirerWebhookDevRequest
{
    public Guid WebhookLogId { get; set; }
}

public sealed class ReprocessAcquirerWebhookDevRequestValidator : Validator<ReprocessAcquirerWebhookDevRequest>
{
    public ReprocessAcquirerWebhookDevRequestValidator()
    {
        RuleFor(x => x.WebhookLogId)
            .NotEmpty()
            .WithMessage("O identificador do log de webhook e obrigatorio.");
    }
}

public sealed class ReprocessAcquirerWebhookDevResponse : BaseResponse<AdminReprocessAcquirerWebhookDevData>;

public sealed class AdminReprocessAcquirerWebhookDevData
{
    public Guid WebhookLogId { get; set; }
    public string? AcquirerType { get; set; }
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? Status { get; set; }
}

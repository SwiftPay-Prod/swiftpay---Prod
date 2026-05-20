using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Payments.ResendWebhook;

public sealed class ResendWebhookRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentId { get; set; }
}

public sealed class ResendWebhookRequestValidator : Validator<ResendWebhookRequest>
{
    public ResendWebhookRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentId)
            .NotEmpty()
            .WithMessage("O identificador do pagamento é obrigatório.");
    }
}

public sealed class ResendWebhookResponse : BaseResponse<ResendWebhookData>;

public sealed class ResendWebhookData
{
    public Guid PaymentId { get; set; }
    public CallbackStatus CallbackStatus { get; set; }
}

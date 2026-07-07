using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Payments.ResendWebhook;

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

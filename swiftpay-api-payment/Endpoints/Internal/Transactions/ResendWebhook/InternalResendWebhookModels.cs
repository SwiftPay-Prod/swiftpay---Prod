using FastEndpoints;
using FluentValidation;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Endpoints.Internal.Transactions.ResendWebhook;

public sealed class InternalResendWebhookRequest
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
}

public sealed class InternalResendWebhookRequestValidator : Validator<InternalResendWebhookRequest>
{
    public InternalResendWebhookRequestValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty().WithMessage("O ID da transação é obrigatório.");

        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O ID do merchant é obrigatório.");
    }
}

public sealed class InternalResendWebhookResponse : BaseResponse<InternalResendWebhookData>;

public sealed class InternalResendWebhookData
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public CallbackStatus? CallbackStatus { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

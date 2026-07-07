using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Payments.ExpirePaymentLink;

public sealed class ExpirePaymentLinkRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentLinkId { get; set; }
}

public sealed class ExpirePaymentLinkRequestValidator : Validator<ExpirePaymentLinkRequest>
{
    public ExpirePaymentLinkRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentLinkId)
            .NotEmpty()
            .WithMessage("O identificador do link de pagamento é obrigatório.");
    }
}

public sealed class ExpirePaymentLinkResponse : BaseResponse;

using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Payments.DeletePaymentLink;

public sealed class DeletePaymentLinkRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentLinkId { get; set; }
}

public sealed class DeletePaymentLinkRequestValidator : Validator<DeletePaymentLinkRequest>
{
    public DeletePaymentLinkRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.PaymentLinkId)
            .NotEmpty()
            .WithMessage("O identificador do link de pagamento é obrigatório.");
    }
}

public sealed class DeletePaymentLinkResponse : BaseResponse;

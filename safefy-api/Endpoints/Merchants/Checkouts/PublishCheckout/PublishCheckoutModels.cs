using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Checkouts.PublishCheckout;

public sealed class PublishCheckoutRequest
{
    public Guid MerchantId { get; set; }
    public Guid CheckoutId { get; set; }
}

public sealed class PublishCheckoutRequestValidator : Validator<PublishCheckoutRequest>
{
    public PublishCheckoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");
            
        RuleFor(x => x.CheckoutId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");
    }
}

public sealed class PublishCheckoutResponse : BaseResponse<CheckoutData>;

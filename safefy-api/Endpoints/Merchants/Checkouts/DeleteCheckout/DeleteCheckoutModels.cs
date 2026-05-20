using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Checkouts.DeleteCheckout;

public sealed class DeleteCheckoutRequest
{
    public Guid MerchantId { get; set; }
    public Guid CheckoutId { get; set; }
}

public sealed class DeleteCheckoutRequestValidator : Validator<DeleteCheckoutRequest>
{
    public DeleteCheckoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.CheckoutId)
            .NotEmpty()
            .WithMessage("O identificador do checkout é obrigatório.");
    }
}

public sealed class DeleteCheckoutResponse : BaseResponse;

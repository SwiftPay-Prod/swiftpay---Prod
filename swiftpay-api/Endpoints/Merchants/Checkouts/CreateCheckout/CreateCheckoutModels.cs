using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Checkouts.CreateCheckout;

public sealed class CreateCheckoutRequest
{
    public Guid MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ApiEnvironment Environment { get; set; }
}

public sealed class CreateCheckoutRequestValidator : Validator<CreateCheckoutRequest>
{
    public CreateCheckoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("O nome do checkout é obrigatório.")
            .MaximumLength(100)
            .WithMessage("O nome deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Environment)
            .IsInEnum()
            .WithMessage("O ambiente deve ser válido.");
    }
}

public sealed class CreateCheckoutResponse : BaseResponse<CheckoutData>;

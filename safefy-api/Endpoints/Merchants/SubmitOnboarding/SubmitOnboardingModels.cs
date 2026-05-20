using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Merchants.Shared.Models;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.SubmitOnboarding;

public sealed class SubmitOnboardingRequest
{
    public Guid Id { get; set; }
}

public sealed class SubmitOnboardingValidator : Validator<SubmitOnboardingRequest>
{
    public SubmitOnboardingValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class SubmitOnboardingResponse : BaseResponse<MerchantData>;

using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.SetDefaultPlatformPayoutAccount;

public sealed class SetDefaultPlatformPayoutAccountRequest
{
    public Guid Id { get; set; }
}

public sealed class SetDefaultPlatformPayoutAccountRequestValidator : Validator<SetDefaultPlatformPayoutAccountRequest>
{
    public SetDefaultPlatformPayoutAccountRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O identificador da conta é obrigatório.");
    }
}

public sealed class SetDefaultPlatformPayoutAccountResponse : BaseResponse;

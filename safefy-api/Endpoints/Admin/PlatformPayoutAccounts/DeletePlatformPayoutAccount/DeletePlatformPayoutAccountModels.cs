using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.DeletePlatformPayoutAccount;

public sealed class DeletePlatformPayoutAccountRequest
{
    public Guid Id { get; set; }
}

public sealed class DeletePlatformPayoutAccountRequestValidator : Validator<DeletePlatformPayoutAccountRequest>
{
    public DeletePlatformPayoutAccountRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O identificador da conta é obrigatório.");
    }
}

public sealed class DeletePlatformPayoutAccountResponse : BaseResponse;

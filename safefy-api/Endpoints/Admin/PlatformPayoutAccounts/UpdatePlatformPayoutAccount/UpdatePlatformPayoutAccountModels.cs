using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Admin.PlatformPayoutAccounts.CreatePlatformPayoutAccount;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.UpdatePlatformPayoutAccount;

public sealed class UpdatePlatformPayoutAccountRequest
{
    public Guid Id { get; set; }
    public PixKeyType? PixKeyType { get; set; }
    public string? PixKey { get; set; }
    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public string? BankName { get; set; }
    public string? BankIspb { get; set; }
}

public sealed class UpdatePlatformPayoutAccountRequestValidator : Validator<UpdatePlatformPayoutAccountRequest>
{
    public UpdatePlatformPayoutAccountRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("O identificador da conta é obrigatório.");
    }
}

public sealed class UpdatePlatformPayoutAccountResponse : BaseResponse<AdminPlatformPayoutAccountData>;

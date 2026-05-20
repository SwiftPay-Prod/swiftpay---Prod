using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Acquirer;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Acquirers.CreateAcquirerAccessAccount;

public sealed class CreateAcquirerAccessAccountRequest
{
    public Guid AcquirerId { get; set; }
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public sealed class CreateAcquirerAccessAccountRequestValidator : Validator<CreateAcquirerAccessAccountRequest>
{
    public CreateAcquirerAccessAccountRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");

        RuleFor(x => x.Login)
            .NotEmpty()
            .WithMessage("O login da conta de acesso é obrigatório.")
            .MaximumLength(150)
            .WithMessage("O login da conta de acesso deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage("A senha da conta de acesso é obrigatória.")
            .MaximumLength(150)
            .WithMessage("A senha da conta de acesso deve ter no máximo 150 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Description))
            .WithMessage("A descrição da conta de acesso deve ter no máximo 500 caracteres.");
    }
}

public sealed class CreateAcquirerAccessAccountResponse : BaseResponse<CreateAcquirerAccessAccountData>;

public sealed class CreateAcquirerAccessAccountData
{
    public Guid AcquirerId { get; set; }
    public List<AcquirerPortalAccessAccount> AccessAccounts { get; set; } = [];
}

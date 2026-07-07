using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Acquirers.CreateAcquirer;

public sealed class CreateAcquirerRequest
{
    public AcquirerType AcquirerType { get; set; }
    public string DisplayName { get; set; } = null!;
    public string? Description { get; set; }
    public List<AcquirerPortalAccessAccountInput>? AccessAccounts { get; set; }
    public bool? PixEnabled { get; set; }
    public bool? BoletoEnabled { get; set; }
    public bool? CreditCardEnabled { get; set; }
}

public sealed class CreateAcquirerRequestValidator : Validator<CreateAcquirerRequest>
{
    public CreateAcquirerRequestValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .WithMessage("O nome de exibição é obrigatório.")
            .MaximumLength(100)
            .WithMessage("O nome de exibição deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("A descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.AccessAccounts)
            .Must(accounts => accounts == null || accounts.Count <= 20)
            .WithMessage("Informe no máximo 20 contas de acesso.");

        RuleForEach(x => x.AccessAccounts)
            .ChildRules(account =>
            {
                account.RuleFor(a => a.Login)
                    .NotEmpty()
                    .WithMessage("O login da conta de acesso é obrigatório.")
                    .MaximumLength(150)
                    .WithMessage("O login da conta de acesso deve ter no máximo 150 caracteres.");

                account.RuleFor(a => a.Password)
                    .NotEmpty()
                    .WithMessage("A senha da conta de acesso é obrigatória.")
                    .MaximumLength(150)
                    .WithMessage("A senha da conta de acesso deve ter no máximo 150 caracteres.");

                account.RuleFor(a => a.Description)
                    .MaximumLength(500)
                    .When(a => !string.IsNullOrWhiteSpace(a.Description))
                    .WithMessage("A descrição da conta de acesso deve ter no máximo 500 caracteres.");
            });
    }
}

public sealed class CreateAcquirerResponse : BaseResponse<CreateAcquirerData>;

public sealed class CreateAcquirerData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string Type { get; set; } = null!;
    public List<string> OperationTypes { get; set; } = [];
    public bool IsActive { get; set; }
    public bool SupportsPix { get; set; }
    public bool SupportsBoleto { get; set; }
    public bool SupportsCreditCard { get; set; }
    public bool PixEnabled { get; set; }
    public bool BoletoEnabled { get; set; }
    public bool CreditCardEnabled { get; set; }
    public List<AcquirerPortalAccessAccount> AccessAccounts { get; set; } = [];
    public DateTime CreatedAt { get; set; }
}

public sealed class AcquirerPortalAccessAccountInput
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Description { get; set; }
}

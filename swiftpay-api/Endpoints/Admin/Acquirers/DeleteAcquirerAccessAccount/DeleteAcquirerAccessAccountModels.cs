using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Acquirers.DeleteAcquirerAccessAccount;

public sealed class DeleteAcquirerAccessAccountRequest
{
    public Guid AcquirerId { get; set; }
    public int AccountIndex { get; set; }
}

public sealed class DeleteAcquirerAccessAccountRequestValidator : Validator<DeleteAcquirerAccessAccountRequest>
{
    public DeleteAcquirerAccessAccountRequestValidator()
    {
        RuleFor(x => x.AcquirerId)
            .NotEmpty()
            .WithMessage("O identificador da adquirente é obrigatório.");

        RuleFor(x => x.AccountIndex)
            .GreaterThanOrEqualTo(0)
            .WithMessage("O índice da conta de acesso é inválido.");
    }
}

public sealed class DeleteAcquirerAccessAccountResponse : BaseResponse<DeleteAcquirerAccessAccountData>;

public sealed class DeleteAcquirerAccessAccountData
{
    public Guid AcquirerId { get; set; }
    public List<AcquirerPortalAccessAccount> AccessAccounts { get; set; } = [];
}

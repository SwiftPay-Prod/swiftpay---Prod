using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.CashoutAccounts.DeleteCashoutAccount;

public sealed class DeleteCashoutAccountRequest
{
    public Guid MerchantId { get; set; }
    public Guid AccountId { get; set; }
    public string Code { get; set; } = string.Empty;
}

public sealed class DeleteCashoutAccountRequestValidator : Validator<DeleteCashoutAccountRequest>
{
    public DeleteCashoutAccountRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.AccountId)
            .NotEmpty()
            .WithMessage("O identificador da conta de saque é obrigatório.");

        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("O código de verificação é obrigatório.")
            .Length(6)
            .WithMessage("O código de verificação deve ter 6 dígitos.")
            .Matches(@"^\d{6}$")
            .WithMessage("O código de verificação deve conter apenas números.");
    }
}

public sealed class DeleteCashoutAccountResponse : BaseResponse;

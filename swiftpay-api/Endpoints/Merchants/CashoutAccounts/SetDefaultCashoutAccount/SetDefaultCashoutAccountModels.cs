using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.SetDefaultCashoutAccount;

public sealed class SetDefaultCashoutAccountRequest
{
    public Guid MerchantId { get; set; }
    public Guid AccountId { get; set; }
    public string Code { get; set; } = string.Empty;
}

public sealed class SetDefaultCashoutAccountRequestValidator : Validator<SetDefaultCashoutAccountRequest>
{
    public SetDefaultCashoutAccountRequestValidator()
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

public sealed class SetDefaultCashoutAccountResponse : BaseResponse<SetDefaultCashoutAccountData>;

public sealed class SetDefaultCashoutAccountData
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
    public PayoutAccountStatus Status { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

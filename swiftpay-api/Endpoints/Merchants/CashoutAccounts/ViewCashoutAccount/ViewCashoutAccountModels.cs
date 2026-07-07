using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.ViewCashoutAccount;

public sealed class ViewCashoutAccountRequest
{
    public Guid MerchantId { get; set; }
    public Guid AccountId { get; set; }
    public string Code { get; set; } = string.Empty;
}

public sealed class ViewCashoutAccountRequestValidator : Validator<ViewCashoutAccountRequest>
{
    public ViewCashoutAccountRequestValidator()
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
            .WithMessage("O código deve ter 6 dígitos.");
    }
}

public sealed class ViewCashoutAccountResponse : BaseResponse<ViewCashoutAccountData>;

public sealed class ViewCashoutAccountData
{
    public Guid Id { get; set; }
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public string? HolderName { get; set; }
    public string? HolderDocument { get; set; }
    public string? BankName { get; set; }
    public string? BankIspb { get; set; }
    public PayoutAccountStatus Status { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

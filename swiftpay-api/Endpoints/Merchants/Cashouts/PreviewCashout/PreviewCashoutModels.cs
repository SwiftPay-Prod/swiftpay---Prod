using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.PreviewCashout;

public sealed class PreviewCashoutRequest
{
    public Guid MerchantId { get; set; }
    public long Amount { get; set; }
    public long AvailableBalance { get; set; }
    public Guid? MerchantAcquirerId { get; set; }
    public bool ConsolidateAllAcquirers { get; set; }
}

public sealed class PreviewCashoutRequestValidator : Validator<PreviewCashoutRequest>
{
    public PreviewCashoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor do saque deve ser maior que zero.");

        RuleFor(x => x.AvailableBalance)
            .GreaterThanOrEqualTo(0)
            .WithMessage("O saldo disponível deve ser maior ou igual a zero.");
    }
}

public sealed class PreviewCashoutResponse : BaseResponse<PreviewCashoutData>;

public sealed class PreviewCashoutData
{
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
    public long MaxWithdrawableAmount { get; set; }
    public long WithdrawNowAvailable { get; set; }
    public bool RequiresFullWithdrawalNow { get; set; }
    public bool HasSufficientBalance { get; set; }
    public bool IsConsolidated { get; set; }
    public int OperationCount { get; set; }
}

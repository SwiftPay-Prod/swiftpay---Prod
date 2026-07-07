using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.RequestCashoutAccountAction;

public sealed class RequestCashoutAccountActionRequest
{
    public Guid MerchantId { get; set; }
    public Guid AccountId { get; set; }
    public PayoutAccountActionType ActionType { get; set; }
}

public sealed class RequestCashoutAccountActionRequestValidator : Validator<RequestCashoutAccountActionRequest>
{
    public RequestCashoutAccountActionRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.AccountId)
            .NotEmpty()
            .WithMessage("O identificador da conta de saque é obrigatório.");

        RuleFor(x => x.ActionType)
            .IsInEnum()
            .WithMessage("O tipo de ação é inválido.");
    }
}

public sealed class RequestCashoutAccountActionResponse : BaseResponse<RequestCashoutAccountActionData>;

public sealed class RequestCashoutAccountActionData
{
    public Guid AccountId { get; set; }
    public PayoutAccountActionType ActionType { get; set; }
    public int ExpiresInMinutes { get; set; }
}

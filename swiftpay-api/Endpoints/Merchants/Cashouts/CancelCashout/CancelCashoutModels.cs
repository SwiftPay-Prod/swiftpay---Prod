using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.CancelCashout;

public sealed class CancelCashoutRequest
{
    public Guid MerchantId { get; set; }
    public Guid CashoutId { get; set; }
}

public sealed class CancelCashoutRequestValidator : Validator<CancelCashoutRequest>
{
    public CancelCashoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.CashoutId)
            .NotEmpty()
            .WithMessage("O identificador do saque é obrigatório.");
    }
}

public sealed class CancelCashoutResponse : BaseResponse<CancelCashoutData>;

public sealed class CancelCashoutData
{
    public Guid Id { get; set; }
    public PayoutStatus Status { get; set; }
}

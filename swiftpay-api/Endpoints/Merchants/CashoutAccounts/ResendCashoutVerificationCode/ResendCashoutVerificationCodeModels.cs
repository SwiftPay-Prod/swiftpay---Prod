using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.CashoutAccounts.ResendCashoutVerificationCode;

public sealed class ResendCashoutVerificationCodeRequest
{
    public Guid MerchantId { get; set; }
    public Guid AccountId { get; set; }
}

public sealed class ResendCashoutVerificationCodeRequestValidator : Validator<ResendCashoutVerificationCodeRequest>
{
    public ResendCashoutVerificationCodeRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.AccountId)
            .NotEmpty()
            .WithMessage("O identificador da conta de saque é obrigatório.");
    }
}

public sealed class ResendCashoutVerificationCodeResponse : BaseResponse;

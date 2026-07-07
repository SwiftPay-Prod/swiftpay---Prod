using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Merchants.Credentials.CreateApiCredential;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Credentials.ConfirmCreateApiCredential;

public sealed class ConfirmCreateApiCredentialRequest
{
    public Guid MerchantId { get; set; }
    public string Code { get; set; } = null!;
}

public sealed class ConfirmCreateApiCredentialRequestValidator : Validator<ConfirmCreateApiCredentialRequest>
{
    public ConfirmCreateApiCredentialRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("O código de confirmação é obrigatório")
            .Length(6).WithMessage("O código deve ter 6 dígitos");
    }
}

public sealed class ConfirmCreateApiCredentialResponse : BaseResponse<ApiCredentialData>;

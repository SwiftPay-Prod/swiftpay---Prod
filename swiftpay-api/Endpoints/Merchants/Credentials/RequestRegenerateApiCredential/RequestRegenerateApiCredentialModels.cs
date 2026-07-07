using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Credentials.RequestRegenerateApiCredential;

public sealed class RequestRegenerateApiCredentialRequest
{
    public Guid MerchantId { get; set; }
    public Guid CredentialId { get; set; }
}

public sealed class RequestRegenerateApiCredentialRequestValidator : Validator<RequestRegenerateApiCredentialRequest>
{
    public RequestRegenerateApiCredentialRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.CredentialId)
            .NotEmpty().WithMessage("O identificador da credencial é obrigatório");
    }
}

public sealed class RequestRegenerateApiCredentialResponse : BaseResponse;

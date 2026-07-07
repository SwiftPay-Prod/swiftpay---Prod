using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Credentials.DeleteApiCredential;

public sealed class DeleteApiCredentialRequest
{
    public Guid MerchantId { get; set; }
    public Guid CredentialId { get; set; }
}

public sealed class DeleteApiCredentialRequestValidator : Validator<DeleteApiCredentialRequest>
{
    public DeleteApiCredentialRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.CredentialId)
            .NotEmpty().WithMessage("O identificador da credencial é obrigatório");
    }
}

public sealed class DeleteApiCredentialResponse : BaseResponse<DeleteApiCredentialData>;

public sealed class DeleteApiCredentialData
{
    public Guid Id { get; set; }
    public string Message { get; set; } = null!;
}

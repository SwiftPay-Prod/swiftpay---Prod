using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Merchants.Credentials.DeleteApiCredential;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Credentials.ConfirmDeleteApiCredential;

public sealed class ConfirmDeleteApiCredentialRequest
{
    public Guid MerchantId { get; set; }
    public Guid CredentialId { get; set; }
    public string Code { get; set; } = null!;
}

public sealed class ConfirmDeleteApiCredentialRequestValidator : Validator<ConfirmDeleteApiCredentialRequest>
{
    public ConfirmDeleteApiCredentialRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório");

        RuleFor(x => x.CredentialId)
            .NotEmpty().WithMessage("O identificador da credencial é obrigatório");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("O código de confirmação é obrigatório")
            .Length(6).WithMessage("O código deve ter 6 dígitos");
    }
}

public sealed class ConfirmDeleteApiCredentialResponse : BaseResponse<DeleteApiCredentialData>;

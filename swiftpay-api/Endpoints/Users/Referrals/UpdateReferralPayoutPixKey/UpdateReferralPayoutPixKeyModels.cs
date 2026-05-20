using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Users.Referrals.UpdateReferralPayoutPixKey;

public sealed class UpdateReferralPayoutPixKeyRequest
{
    public Guid VerificationId { get; set; }
    public string Code { get; set; } = string.Empty;
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
}

public sealed class UpdateReferralPayoutPixKeyRequestValidator : Validator<UpdateReferralPayoutPixKeyRequest>
{
    public UpdateReferralPayoutPixKeyRequestValidator()
    {
        RuleFor(x => x.VerificationId)
            .NotEmpty().WithMessage("O identificador de verificação é obrigatório.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("O código de verificação é obrigatório.")
            .Length(6).WithMessage("O código de verificação deve ter 6 dígitos.")
            .Matches("^[0-9]{6}$").WithMessage("O código de verificação deve conter apenas números.");

        RuleFor(x => x.PixKey)
            .NotEmpty().WithMessage("A chave PIX é obrigatória.")
            .MaximumLength(120).WithMessage("A chave PIX deve ter no máximo 120 caracteres.");
    }
}

public sealed class UpdateReferralPayoutPixKeyResponse : BaseResponse<UpdateReferralPayoutPixKeyData>;

public sealed class UpdateReferralPayoutPixKeyData
{
    public PixKeyType PixKeyType { get; set; }
    public string PixKey { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

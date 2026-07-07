using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.ReadReferralOwner;

public sealed class ReadReferralOwnerRequest
{
    public string RefCode { get; set; } = string.Empty;
}

public sealed class ReadReferralOwnerRequestValidator : Validator<ReadReferralOwnerRequest>
{
    public ReadReferralOwnerRequestValidator()
    {
        RuleFor(x => x.RefCode)
            .NotEmpty().WithMessage("Código de indicação inválido.")
            .MaximumLength(32).WithMessage("Código de indicação inválido.")
            .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Código de indicação inválido.");
    }
}

public sealed class ReadReferralOwnerResponse : BaseResponse<ReadReferralOwnerData>;

public sealed class ReadReferralOwnerData
{
    public string RefCode { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
}

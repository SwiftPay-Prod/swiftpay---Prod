using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.ResendDeviceCode;

public sealed class ResendDeviceCodeRequest
{
    public Guid VerificationId { get; set; }
}

public sealed class ResendDeviceCodeRequestValidator : Validator<ResendDeviceCodeRequest>
{
    public ResendDeviceCodeRequestValidator()
    {
        RuleFor(x => x.VerificationId)
            .NotEmpty().WithMessage("ID de verificação é obrigatório");
    }
}

public sealed class ResendDeviceCodeResponse : BaseResponse<ResendDeviceCodeData>;

public sealed class ResendDeviceCodeData
{
    public Guid VerificationId { get; set; }
    public DateTime ExpiresAt { get; set; }
}

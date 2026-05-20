using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Auth.Shared.Models;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Auth.VerifyDevice;

public class VerifyDeviceRequest
{
    public Guid VerificationId { get; set; }
    public string Code { get; set; } = null!;
    public string DeviceId { get; set; } = null!;
}

public class VerifyDeviceRequestValidator : Validator<VerifyDeviceRequest>
{
    public VerifyDeviceRequestValidator()
    {
        RuleFor(x => x.VerificationId)
            .NotEmpty().WithMessage("ID de verificação é obrigatório");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Código é obrigatório")
            .Length(6).WithMessage("Código deve ter 6 dígitos")
            .Matches("^[0-9]+$").WithMessage("Código deve conter apenas números");

        RuleFor(x => x.DeviceId)
            .NotEmpty().WithMessage("DeviceId é obrigatório")
            .MaximumLength(100).WithMessage("DeviceId inválido");
    }
}

public class VerifyDeviceResponse : BaseResponse<AuthResponse>;

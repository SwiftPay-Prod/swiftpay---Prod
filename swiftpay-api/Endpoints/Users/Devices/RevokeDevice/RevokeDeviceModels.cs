using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Devices.RevokeDevice;

public class RevokeDeviceRequest
{
    public string DeviceId { get; set; } = null!;
}

public class RevokeDeviceRequestValidator : Validator<RevokeDeviceRequest>
{
    public RevokeDeviceRequestValidator()
    {
        RuleFor(x => x.DeviceId)
            .NotEmpty().WithMessage("ID do dispositivo é obrigatório");
    }
}

public class RevokeDeviceResponse : BaseResponse;

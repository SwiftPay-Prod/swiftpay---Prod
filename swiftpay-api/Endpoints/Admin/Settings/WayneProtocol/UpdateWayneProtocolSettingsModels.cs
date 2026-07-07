using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Settings.WayneProtocol;

public sealed class UpdateWayneProtocolSettingsRequest
{
    public string Environment { get; set; } = "Production";
    public bool IsEnabled { get; set; }
    public int CycleVolume { get; set; }
    public int SamplingRatePercent { get; set; }
}

public sealed class UpdateWayneProtocolSettingsValidator : Validator<UpdateWayneProtocolSettingsRequest>
{
    public UpdateWayneProtocolSettingsValidator()
    {
        RuleFor(x => x.Environment)
            .Must(env => env.Equals("Production", StringComparison.OrdinalIgnoreCase)
                      || env.Equals("Sandbox", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Environment deve ser Sandbox ou Production.");

        RuleFor(x => x.CycleVolume)
            .InclusiveBetween(1, 100000)
            .WithMessage("CycleVolume deve estar entre 1 e 100000.");

        RuleFor(x => x.SamplingRatePercent)
            .InclusiveBetween(0, 100)
            .WithMessage("SamplingRatePercent deve estar entre 0 e 100.");
    }
}

public sealed class UpdateWayneProtocolSettingsResponse : BaseResponse<AdminWayneProtocolSettingsData>;

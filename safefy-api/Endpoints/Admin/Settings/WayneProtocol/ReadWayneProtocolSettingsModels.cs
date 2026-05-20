using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Settings.WayneProtocol;

public sealed class ReadWayneProtocolSettingsRequest
{
    public string? Environment { get; set; }
}

public sealed class ReadWayneProtocolSettingsValidator : Validator<ReadWayneProtocolSettingsRequest>
{
    public ReadWayneProtocolSettingsValidator()
    {
        RuleFor(x => x.Environment)
            .Must(env => string.IsNullOrWhiteSpace(env)
                || env.Equals("Production", StringComparison.OrdinalIgnoreCase)
                || env.Equals("Sandbox", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Environment deve ser Sandbox ou Production.");
    }
}

public sealed class ReadWayneProtocolSettingsResponse : BaseResponse<AdminWayneProtocolSettingsData>;

public sealed class AdminWayneProtocolSettingsData
{
    public string Environment { get; set; } = "Production";
    public bool IsEnabled { get; set; }
    public int CycleVolume { get; set; }
    public int SamplingRatePercent { get; set; }
}

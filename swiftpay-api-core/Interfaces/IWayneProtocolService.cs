using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

public sealed record WayneProtocolConfig(bool IsEnabled, int CycleVolume, int SamplingRatePercent);

public sealed record WayneProtocolDecision(
    bool Apply,
    long CycleNumber,
    int PositionInCycle,
    int CycleVolume,
    int SamplingRatePercent,
    int MarkedTargetInCycle);

public interface IWayneProtocolService
{
    Task<WayneProtocolConfig> GetConfigAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task<WayneProtocolConfig> UpsertConfigAsync(
        ApiEnvironment environment,
        bool isEnabled,
        int cycleVolume,
        int samplingRatePercent,
        Guid updatedByUserId,
        CancellationToken ct = default);

    Task<WayneProtocolDecision> EvaluateAsync(ApiEnvironment environment, CancellationToken ct = default);
}

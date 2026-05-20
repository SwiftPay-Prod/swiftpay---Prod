namespace safefy_api_core.Interfaces;

public interface IAcquirerNominalTrackingService
{
    Task TrackNominalFromPixAsync(
        Guid acquirerId,
        Guid paymentId,
        string? copyAndPaste,
        CancellationToken ct = default);
}

using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Interfaces;

public interface IRankingProcessingStatusService
{
    Task MarkVolumeQueuedAsync(ApiEnvironment environment, RankingPeriod period, CancellationToken ct = default);
    Task MarkVolumeCompletedAsync(ApiEnvironment environment, RankingPeriod period, CancellationToken ct = default);
    Task<RankingProcessingStatus> GetVolumeStatusAsync(ApiEnvironment environment, RankingPeriod period, CancellationToken ct = default);

    Task MarkReferralQueuedAsync(ApiEnvironment environment, CancellationToken ct = default);
    Task MarkReferralCompletedAsync(ApiEnvironment environment, CancellationToken ct = default);
    Task<RankingProcessingStatus> GetReferralStatusAsync(ApiEnvironment environment, CancellationToken ct = default);

    Task MarkAcquirerQueuedAsync(ApiEnvironment environment, CancellationToken ct = default);
    Task MarkAcquirerCompletedAsync(ApiEnvironment environment, CancellationToken ct = default);
    Task<RankingProcessingStatus> GetAcquirerStatusAsync(ApiEnvironment environment, CancellationToken ct = default);
}

namespace swiftpay_api.Interfaces;

public interface IRankingSchedulerService
{
    Task QueueProductionRankingsAsync(CancellationToken ct = default);
}

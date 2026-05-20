namespace safefy_api.Interfaces;

public interface IRankingSchedulerService
{
    Task QueueProductionRankingsAsync(CancellationToken ct = default);
}

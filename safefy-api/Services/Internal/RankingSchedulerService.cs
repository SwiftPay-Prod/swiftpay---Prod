using safefy_api.Interfaces;
using safefy_api_core.Constants;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;

namespace safefy_api.Services.Internal;

public sealed class RankingSchedulerService(
    IMessagePublisher messagePublisher,
    IRankingProcessingStatusService rankingProcessingStatusService,
    ILogger<RankingSchedulerService> logger
) : IRankingSchedulerService
{
    public async Task QueueProductionRankingsAsync(CancellationToken ct = default)
    {
        try
        {
            foreach (var period in Enum.GetValues<RankingPeriod>())
            {
                await rankingProcessingStatusService.MarkVolumeQueuedAsync(ApiEnvironment.Production, period, ct);
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.ProcessRanking,
                    new ProcessRankingMessage
                    {
                        Environment = ApiEnvironment.Production,
                        Period = period
                    });
            }

            await rankingProcessingStatusService.MarkReferralQueuedAsync(ApiEnvironment.Production, ct);
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessReferralRanking,
                new ProcessReferralRankingMessage
                {
                    Environment = ApiEnvironment.Production
                });

            await rankingProcessingStatusService.MarkAcquirerQueuedAsync(ApiEnvironment.Production, ct);
            await messagePublisher.PublishAsync(
                RabbitMQQueues.ProcessAcquirerRanking,
                new ProcessAcquirerRankingMessage
                {
                    Environment = ApiEnvironment.Production
                });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error scheduling ranking processing");
            throw;
        }
    }
}

using FastEndpoints;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Ranking.TriggerRankingReprocess;

public sealed class TriggerRankingReprocessEndpoint(
    IMessagePublisher messagePublisher,
    IRankingProcessingStatusService rankingProcessingStatusService
) : EndpointWithoutRequest<BaseResponse>
{
    public override void Configure()
    {
        Post("ranking/reprocess");
        Group<AdminGroup>();
        Roles(nameof(UserRole.God));
    }

    public override async Task HandleAsync(CancellationToken ct)
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

        await Send.OkAsync(new BaseResponse
        {
            Message = "Reprocessamento do ranking iniciado para todos os tipos, períodos e ambientes."
        }, ct);
    }
}

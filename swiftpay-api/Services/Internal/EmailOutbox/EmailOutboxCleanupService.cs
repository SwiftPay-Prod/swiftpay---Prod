using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;
using swiftpay_api_core.Services;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public sealed class EmailOutboxCleanupProcessor(
    IEmailOutboxStore store,
    IServiceScopeFactory scopeFactory,
    IOptions<EmailPlatformSettings> options,
    TimeProvider timeProvider)
{
    private readonly EmailPlatformSettings _settings = options.Value;

    public async Task<EmailOutboxCleanupResult> RunPageAsync(
        string? pageToken,
        CancellationToken cancellationToken = default)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var candidates = await store.FindCleanupCandidatesAsync(
            now,
            _settings.CleanupBatchSize,
            pageToken,
            cancellationToken);
        var summaries = 0;
        var redacted = 0;
        var deleted = 0;

        foreach (var candidate in candidates)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var summariesStore = scope.ServiceProvider.GetRequiredService<IEmailTerminalSummaryStore>();
            var persisted = await summariesStore.PersistAsync(
                candidate.IntentId,
                Map(candidate.Status),
                candidate.Status == EmailOutboxStatus.Accepted ? null : candidate.SafeErrorCode,
                candidate.OccurredAt,
                candidate.Status == EmailOutboxStatus.Accepted ? candidate.ProviderAcceptedAt : null,
                now,
                cancellationToken);
            if (!persisted)
            {
                continue;
            }
            summaries++;

            if (candidate.Status is EmailOutboxStatus.Accepted or EmailOutboxStatus.Failed)
            {
                if (await store.DeleteTerminalAsync(candidate.IntentId, now, cancellationToken)) deleted++;
                continue;
            }

            if (!candidate.PayloadRedacted &&
                await store.RedactTerminalPayloadAsync(candidate.IntentId, now, cancellationToken))
                redacted++;

            if (candidate.UpdatedAt <= now.AddDays(-_settings.SafeMetadataRetentionDays) &&
                await store.DeleteTerminalAsync(candidate.IntentId, now, cancellationToken))
                deleted++;
        }

        var next = candidates.Count == _settings.CleanupBatchSize
            ? FirestoreEmailOutboxStore.PageToken(candidates[^1])
            : null;
        return new EmailOutboxCleanupResult(candidates.Count, summaries, redacted, deleted, next);
    }

    private static EmailDeliveryTerminalStatus Map(EmailOutboxStatus status) => status switch
    {
        EmailOutboxStatus.Accepted => EmailDeliveryTerminalStatus.Accepted,
        EmailOutboxStatus.Failed => EmailDeliveryTerminalStatus.Failed,
        EmailOutboxStatus.DeadLetter => EmailDeliveryTerminalStatus.DeadLetter,
        EmailOutboxStatus.DeliveryUnknown => EmailDeliveryTerminalStatus.DeliveryUnknown,
        _ => throw new InvalidOperationException("Cleanup cannot summarize a non-terminal email.")
    };
}

public sealed class EmailOutboxCleanupHostedService(
    EmailOutboxCleanupProcessor processor,
    TimeProvider timeProvider,
    ILogger<EmailOutboxCleanupHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromDays(1), timeProvider);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                var result = await processor.RunPageAsync(null, stoppingToken);
                logger.LogInformation(
                    "Email cleanup examined {Examined}, summarized {Summaries}, redacted {Redacted}, deleted {Deleted}",
                    result.Examined,
                    result.SummariesPersisted,
                    result.PayloadsRedacted,
                    result.DocumentsDeleted);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Email outbox cleanup failed");
            }
        }
    }
}

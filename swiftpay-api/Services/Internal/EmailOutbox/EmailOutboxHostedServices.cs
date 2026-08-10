using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api.Services.Internal.EmailOutbox;

public sealed class EmailOutboxWorkerService(
    IEmailOutboxStore store,
    IEmailProviderTransport transport,
    IEmailOutboxWorkQueue queue,
    IEmailRetryBackoff backoff,
    IOptions<EmailPlatformSettings> options,
    TimeProvider timeProvider,
    ILogger<EmailOutboxWorkerService> logger) : BackgroundService
{
    private readonly EmailPlatformSettings _settings = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var listener = ListenAsync(stoppingToken);
        try
        {
            await foreach (var intentId in queue.ReadAllAsync(stoppingToken))
            {
                await ProcessAsync(intentId);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
        finally
        {
            try { await listener; }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
        }
    }

    private async Task ListenAsync(CancellationToken stoppingToken)
    {
        await foreach (var intentId in store.ListenForQueuedAsync(stoppingToken))
        {
            await queue.EnqueueAsync(intentId, stoppingToken);
        }
    }

    private async Task ProcessAsync(Guid intentId)
    {
        try
        {
            await ProcessCoreAsync(intentId);
        }
        catch (Exception exception)
        {
            // Never let an unexpected exception escape: it would abort the
            // queue loop and wedge every subsequent intent. The claim lease
            // expires on its own and the recovery service re-enqueues it.
            logger.LogError(exception, "Email intent {IntentId} processing crashed; lease will expire and recovery will retry", intentId);
        }
    }

    private async Task ProcessCoreAsync(Guid intentId)
    {
        var now = timeProvider.GetUtcNow().UtcDateTime;
        var claim = await store.TryClaimAsync(intentId, _settings.WorkerId, now, CancellationToken.None);
        if (claim.Outcome != EmailOutboxClaimOutcome.Claimed || claim.Message?.LeaseToken is not { } leaseToken)
            return;

        var message = claim.Message;
        if (message.LeaseExpiresAt - now < TimeSpan.FromSeconds(_settings.MinimumLeaseBeforeProviderSeconds))
        {
            var renewed = await store.RenewLeaseAsync(intentId, leaseToken, now, CancellationToken.None);
            if (!renewed.Applied) return;
        }

        var prepared = await store.PrepareProviderAttemptAsync(intentId, leaseToken, now, CancellationToken.None);
        if (prepared is null) return;

        EmailProviderResult providerResult;
        using (var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(_settings.ProviderTimeoutSeconds)))
        {
            providerResult = await transport.SendAsync(prepared.Envelope, timeout.Token);
        }

        now = timeProvider.GetUtcNow().UtcDateTime;
        var nextDelay = backoff.GetDelay(intentId,
            providerResult.Outcome == EmailProviderOutcome.Ambiguous
                ? prepared.AmbiguousAttemptCount + 1
                : prepared.RetryableFailureCount + 1);
        switch (providerResult.Outcome)
        {
            case EmailProviderOutcome.Accepted:
                await store.FinalizeAcceptedAsync(intentId, leaseToken, providerResult.ProviderMessageId!, now, CancellationToken.None);
                logger.LogInformation("Email intent {IntentId} accepted by provider", intentId);
                break;
            case EmailProviderOutcome.PermanentFailure:
                await store.FinalizePermanentFailureAsync(intentId, leaseToken,
                    providerResult.SafeErrorClass!, providerResult.SafeErrorCode!, now, CancellationToken.None);
                logger.LogWarning("Email intent {IntentId} permanently rejected with {ErrorCode}", intentId, providerResult.SafeErrorCode);
                break;
            case EmailProviderOutcome.TransientFailure:
                await store.ScheduleRetryAsync(intentId, leaseToken,
                    providerResult.SafeErrorClass!, providerResult.SafeErrorCode!, now.Add(nextDelay), now, CancellationToken.None);
                break;
            case EmailProviderOutcome.RateLimited:
                await store.PauseForRateLimitAsync(intentId, leaseToken,
                    now.Add(providerResult.RetryAfter ?? TimeSpan.FromMinutes(1)), now, CancellationToken.None);
                logger.LogWarning("Email provider rate limited; processing paused without consuming item retry");
                break;
            case EmailProviderOutcome.Ambiguous:
                await store.ScheduleAmbiguousRetryAsync(intentId, leaseToken,
                    providerResult.SafeErrorClass!, providerResult.SafeErrorCode!, now.Add(nextDelay), now, CancellationToken.None);
                logger.LogWarning("Email intent {IntentId} has ambiguous provider outcome", intentId);
                break;
        }
    }
}

public sealed class EmailOutboxRecoveryService(
    IEmailOutboxStore store,
    IEmailOutboxWorkQueue queue,
    IOptions<EmailPlatformSettings> options,
    TimeProvider timeProvider,
    ILogger<EmailOutboxRecoveryService> logger) : BackgroundService
{
    private readonly EmailPlatformSettings _settings = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(_settings.RecoveryIntervalSeconds), timeProvider);
        do
        {
            try
            {
                var now = timeProvider.GetUtcNow().UtcDateTime;
                var pausedUntil = await store.GetProviderPausedUntilAsync(stoppingToken);
                if (pausedUntil <= now || !pausedUntil.HasValue)
                {
                    var recoverable = await store.FindRecoverableAsync(now, _settings.WorkerBatchSize, stoppingToken);
                    foreach (var intentId in recoverable)
                        await queue.EnqueueAsync(intentId, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Email outbox recovery scan failed");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}

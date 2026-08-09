using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Interfaces;

public interface IEmailOutboxStore
{
    IAsyncEnumerable<Guid> ListenForQueuedAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Guid>> FindRecoverableAsync(
        DateTime nowUtc,
        int limit,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxClaimResult> TryClaimAsync(
        Guid intentId,
        string leaseOwner,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxTransitionResult> RenewLeaseAsync(
        Guid intentId,
        string leaseToken,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxSnapshot?> PrepareProviderAttemptAsync(
        Guid intentId,
        string leaseToken,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxTransitionResult> FinalizeAcceptedAsync(
        Guid intentId,
        string leaseToken,
        string providerMessageId,
        DateTime acceptedAtUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxTransitionResult> FinalizePermanentFailureAsync(
        Guid intentId,
        string leaseToken,
        string safeErrorClass,
        string safeErrorCode,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxTransitionResult> ScheduleRetryAsync(
        Guid intentId,
        string leaseToken,
        string safeErrorClass,
        string safeErrorCode,
        DateTime nextAttemptAtUtc,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxTransitionResult> ScheduleAmbiguousRetryAsync(
        Guid intentId,
        string leaseToken,
        string safeErrorClass,
        string safeErrorCode,
        DateTime nextAttemptAtUtc,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<EmailOutboxTransitionResult> PauseForRateLimitAsync(
        Guid intentId,
        string leaseToken,
        DateTime pausedUntilUtc,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<DateTime?> GetProviderPausedUntilAsync(CancellationToken cancellationToken = default);

    Task<EmailOutboxSnapshot?> GetAsync(
        Guid intentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EmailOutboxCleanupCandidate>> FindCleanupCandidatesAsync(
        DateTime nowUtc,
        int limit,
        string? pageToken,
        CancellationToken cancellationToken = default);

    Task<bool> RedactTerminalPayloadAsync(
        Guid intentId,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteTerminalAsync(
        Guid intentId,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);
}

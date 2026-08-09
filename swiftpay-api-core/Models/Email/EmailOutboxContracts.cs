namespace swiftpay_api_core.Models.Email;

public enum EmailOutboxStatus
{
    Queued = 0,
    Processing = 1,
    RetryScheduled = 2,
    Accepted = 3,
    Failed = 4,
    DeadLetter = 5,
    DeliveryUnknown = 6
}

public enum EmailOutboxPublishOutcome
{
    Created = 0,
    AlreadyPublished = 1,
    Conflict = 2
}

public enum EmailQuotaReservationState
{
    Claimed = 0,
    Released = 1
}

public enum EmailOutboxClaimOutcome
{
    Claimed = 0,
    Ineligible = 1,
    Terminalized = 2,
    ProviderPaused = 3,
    QuotaUnavailable = 4,
    NotFound = 5
}

public enum EmailProviderOutcome
{
    Accepted = 0,
    PermanentFailure = 1,
    TransientFailure = 2,
    RateLimited = 3,
    Ambiguous = 4
}

public sealed record EmailOutboxEnvelope
{
    public const int CurrentSchemaVersion = 1;

    public int SchemaVersion { get; init; } = CurrentSchemaVersion;
    public required Guid IntentId { get; init; }
    public required string RequestHash { get; init; }
    public required string EnvelopeHash { get; init; }
    public required EmailMessageType MessageType { get; init; }
    public required EmailDeliveryClass DeliveryClass { get; init; }
    public required string DedupeKey { get; init; }
    public required string Recipient { get; init; }
    public required string From { get; init; }
    public string? ReplyTo { get; init; }
    public required string Subject { get; init; }
    public required string HtmlBody { get; init; }
    public string? TextBody { get; init; }
    public DateTime? SendBefore { get; init; }
    public required string CorrelationId { get; init; }
    public Guid? UserId { get; init; }
    public Guid? MerchantId { get; init; }
}

public readonly record struct EmailOutboxPublishRequest(EmailOutboxEnvelope Envelope);

public readonly record struct EmailOutboxPublishResult(
    Guid IntentId,
    EmailOutboxPublishOutcome Outcome,
    EmailOutboxStatus Status);

public sealed record EmailOutboxSnapshot
{
    public required EmailOutboxEnvelope Envelope { get; init; }
    public required EmailOutboxStatus Status { get; init; }
    public int AttemptCount { get; init; }
    public int RetryableFailureCount { get; init; }
    public int AmbiguousAttemptCount { get; init; }
    public bool AcceptanceUnknown { get; init; }
    public DateTime NextAttemptAt { get; init; }
    public string? LeaseOwner { get; init; }
    public string? LeaseToken { get; init; }
    public DateTime? LeaseExpiresAt { get; init; }
    public DateTime? FirstProviderAttemptAt { get; init; }
    public DateTime? IdempotencyExpiresAt { get; init; }
    public string? QuotaReservationDay { get; init; }
    public EmailDeliveryClass? QuotaReservationClass { get; init; }
    public EmailQuotaReservationState? QuotaReservationState { get; init; }
    public string? ProviderMessageId { get; init; }
    public DateTime? ProviderAcceptedAt { get; init; }
    public DateTime? DeadLetteredAt { get; init; }
    public string? LastErrorClass { get; init; }
    public string? LastErrorCode { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required DateTime UpdatedAt { get; init; }
    public bool PayloadRedacted { get; init; }
}

public readonly record struct EmailOutboxClaimResult(
    EmailOutboxClaimOutcome Outcome,
    EmailOutboxSnapshot? Message);

public readonly record struct EmailOutboxTransitionResult(
    bool Applied,
    EmailOutboxStatus? Status);

public readonly record struct EmailProviderResult(
    EmailProviderOutcome Outcome,
    string? ProviderMessageId,
    string? SafeErrorClass,
    string? SafeErrorCode,
    TimeSpan? RetryAfter)
{
    public static EmailProviderResult Accepted(string providerMessageId) =>
        new(EmailProviderOutcome.Accepted, providerMessageId, null, null, null);
}

public readonly record struct EmailOutboxCleanupCandidate(
    Guid IntentId,
    EmailOutboxStatus Status,
    string? SafeErrorCode,
    DateTime OccurredAt,
    DateTime? ProviderAcceptedAt,
    bool PayloadRedacted,
    DateTime UpdatedAt);

public readonly record struct EmailOutboxCleanupResult(
    int Examined,
    int SummariesPersisted,
    int PayloadsRedacted,
    int DocumentsDeleted,
    string? NextPageToken);

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Services;

namespace swiftpay_api_core.Models.Database;

public sealed class EmailIntent : BaseEntity
{
    private const int MaximumSafeErrorCodeLength = 128;

    private EmailIntent()
    {
    }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public Guid Id { get; private set; }

    public string DedupeKey { get; private set; } = null!;
    public string RequestHash { get; private set; } = null!;
    public string? EnvelopeHash { get; private set; }
    public EmailIntentKind IntentKind { get; private set; }
    public EmailMessageType MessageType { get; private set; }
    public EmailDeliveryClass DeliveryClass { get; private set; }
    public int TemplateVersion { get; private set; }
    public string RecipientAddress { get; private set; } = null!;
    public EmailIntentOwnerType OwnerType { get; private set; }
    public Guid OwnerId { get; private set; }
    public string RequestPayloadJson { get; private set; } = null!;
    public EmailAuthActionType? AuthActionType { get; private set; }
    public string? ContinueUrl { get; private set; }
    public DateTime? CooldownWindowUtc { get; private set; }
    public string CorrelationId { get; private set; } = null!;

    public EmailIntentState State { get; set; } = EmailIntentState.PendingMaterialization;
    public int MaterializationAttemptCount { get; set; }
    public DateTime? NextMaterializationAt { get; set; }
    public string? MaterializationLeaseToken { get; set; }
    public DateTime? MaterializationLeaseUntil { get; set; }
    public DateTime? MaterializedAt { get; private set; }

    public string? Subject { get; private set; }
    public string? HtmlBody { get; private set; }
    public string? TextBody { get; private set; }
    public string? ActionLink { get; private set; }
    public DateTime? SendBefore { get; private set; }

    public int PublishAttemptCount { get; set; }
    public DateTime? NextPublishAt { get; set; }
    public string? PublishLeaseToken { get; set; }
    public DateTime? PublishLeaseUntil { get; set; }
    public DateTime? PublishedAt { get; set; }

    public string? LastErrorClass { get; set; }
    public string? LastErrorCode { get; set; }
    public DateTime? LastErrorAt { get; set; }

    public EmailDeliveryTerminalStatus? TerminalStatus { get; private set; }
    public string? TerminalErrorCode { get; private set; }
    public DateTime? TerminalOccurredAt { get; private set; }
    public DateTime? ProviderAcceptedAt { get; private set; }
    public DateTime? TerminalRecordedAt { get; private set; }

    internal static EmailIntent Create(
        Guid id,
        EmailIntentAddRequest request,
        EmailIntentCatalogDefinition definition,
        CanonicalEmailIntentRequest canonical,
        DateTime createdAt)
    {
        return new EmailIntent
        {
            Id = id,
            DedupeKey = request.Dedupe.Value,
            RequestHash = canonical.RequestHash,
            IntentKind = definition.IntentKind,
            MessageType = definition.MessageType,
            DeliveryClass = definition.DeliveryClass,
            TemplateVersion = definition.TemplateVersion,
            RecipientAddress = canonical.RecipientAddress,
            OwnerType = request.Owner.Type,
            OwnerId = request.Owner.Id,
            RequestPayloadJson = canonical.RequestPayloadJson,
            AuthActionType = request.AuthAction?.ActionType,
            ContinueUrl = canonical.ContinueUrl,
            CooldownWindowUtc = request.Dedupe.CooldownWindowUtc,
            CorrelationId = canonical.CorrelationId,
            State = EmailIntentState.PendingMaterialization,
            NextMaterializationAt = createdAt,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
    }

    public string RecordMaterializedEnvelope(EmailEnvelopeHashInput envelope, DateTime materializedAt)
    {
        ArgumentNullException.ThrowIfNull(envelope);
        RequireUtc(materializedAt, nameof(materializedAt));

        var normalizedRecipient = EmailIntentCanonicalizer.NormalizeRecipient(envelope.RecipientAddress);
        if (!string.Equals(RecipientAddress, normalizedRecipient, StringComparison.Ordinal))
            throw new InvalidOperationException("The materialized envelope recipient differs from the immutable request.");

        var envelopeHash = EmailIntentHash.ComputeEnvelopeHash(envelope);
        if (EnvelopeHash is not null)
        {
            if (!string.Equals(EnvelopeHash, envelopeHash, StringComparison.Ordinal) ||
                !string.Equals(Subject, envelope.Subject, StringComparison.Ordinal) ||
                !string.Equals(HtmlBody, envelope.HtmlBody, StringComparison.Ordinal) ||
                !string.Equals(TextBody, envelope.TextBody, StringComparison.Ordinal) ||
                !string.Equals(ActionLink, envelope.ActionLink, StringComparison.Ordinal) ||
                SendBefore != envelope.SendBefore)
            {
                throw new InvalidOperationException("The materialized email envelope is immutable.");
            }

            return EnvelopeHash;
        }

        EnvelopeHash = envelopeHash;
        Subject = envelope.Subject;
        HtmlBody = envelope.HtmlBody;
        TextBody = envelope.TextBody;
        SendBefore = envelope.SendBefore;
        ActionLink = envelope.ActionLink;
        MaterializedAt = materializedAt;
        State = EmailIntentState.ReadyToPublish;
        MaterializationLeaseToken = null;
        MaterializationLeaseUntil = null;
        NextMaterializationAt = null;
        LastErrorClass = null;
        LastErrorCode = null;
        LastErrorAt = null;
        UpdatedAt = materializedAt;
        return envelopeHash;
    }

    public void RecordTerminalSummary(
        EmailDeliveryTerminalStatus status,
        string? safeErrorCode,
        DateTime occurredAt,
        DateTime? providerAcceptedAt,
        DateTime recordedAt)
    {
        RequireUtc(occurredAt, nameof(occurredAt));
        RequireUtc(recordedAt, nameof(recordedAt));
        if (providerAcceptedAt.HasValue)
            RequireUtc(providerAcceptedAt.Value, nameof(providerAcceptedAt));

        var normalizedErrorCode = NormalizeSafeErrorCode(status, safeErrorCode);
        if (status == EmailDeliveryTerminalStatus.Accepted && !providerAcceptedAt.HasValue)
            throw new ArgumentException("Accepted summaries require the provider acceptance timestamp.", nameof(providerAcceptedAt));
        if (status != EmailDeliveryTerminalStatus.Accepted && providerAcceptedAt.HasValue)
            throw new ArgumentException("Only Accepted summaries can expose a provider acceptance timestamp.", nameof(providerAcceptedAt));

        if (TerminalStatus.HasValue)
        {
            if (TerminalStatus != status ||
                !string.Equals(TerminalErrorCode, normalizedErrorCode, StringComparison.Ordinal) ||
                TerminalOccurredAt != occurredAt ||
                ProviderAcceptedAt != providerAcceptedAt)
            {
                throw new InvalidOperationException("The terminal email summary is immutable.");
            }

            return;
        }

        TerminalStatus = status;
        TerminalErrorCode = normalizedErrorCode;
        TerminalOccurredAt = occurredAt;
        ProviderAcceptedAt = providerAcceptedAt;
        TerminalRecordedAt = recordedAt;
        UpdatedAt = recordedAt;
    }

    public EmailIntentTerminalSummary? GetTerminalSummary(EmailIntentOwner owner)
    {
        if (owner.Type != OwnerType || owner.Id != OwnerId ||
            !TerminalStatus.HasValue || !TerminalOccurredAt.HasValue || !TerminalRecordedAt.HasValue)
        {
            return null;
        }

        return new EmailIntentTerminalSummary(
            Id,
            TerminalStatus.Value,
            TerminalErrorCode,
            TerminalOccurredAt.Value,
            ProviderAcceptedAt,
            TerminalRecordedAt.Value);
    }

    private static string? NormalizeSafeErrorCode(
        EmailDeliveryTerminalStatus status,
        string? safeErrorCode)
    {
        if (status == EmailDeliveryTerminalStatus.Accepted)
        {
            if (!string.IsNullOrWhiteSpace(safeErrorCode))
                throw new ArgumentException("Accepted summaries cannot contain an error code.", nameof(safeErrorCode));
            return null;
        }

        if (string.IsNullOrWhiteSpace(safeErrorCode))
            throw new ArgumentException("A safe terminal error code is required.", nameof(safeErrorCode));

        var normalized = safeErrorCode.Trim();
        if (normalized.Length > MaximumSafeErrorCodeLength || normalized.Any(character =>
                !char.IsAsciiLetterOrDigit(character) && character is not '.' and not '_' and not '-' and not ':'))
        {
            throw new ArgumentException("The terminal error code contains unsafe data.", nameof(safeErrorCode));
        }

        return normalized;
    }

    private static void RequireUtc(DateTime timestamp, string parameterName)
    {
        if (timestamp.Kind != DateTimeKind.Utc)
            throw new ArgumentException("The timestamp must use UTC.", parameterName);
    }
}

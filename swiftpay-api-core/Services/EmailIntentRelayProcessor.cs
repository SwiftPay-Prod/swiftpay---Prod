using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public readonly record struct EmailRelayBatchResult(int Materialized, int Published, int Claimed)
{
    public bool MayHaveMore(int batchSize) => Claimed >= batchSize;
}

public sealed class EmailIntentRelayProcessor(
    PrimaryDbContext dbContext,
    IEmailMessageTemplateCatalog templateCatalog,
    IEmailTemplateRenderer templateRenderer,
    IFirebaseAuthActionLinkGenerator authLinkGenerator,
    IEmailOutboxPublisher outboxPublisher,
    IOptions<EmailPlatformSettings> settings,
    TimeProvider timeProvider,
    ILogger<EmailIntentRelayProcessor> logger)
{
    private readonly EmailPlatformSettings _settings = settings.Value;

    public async Task<EmailRelayBatchResult> ProcessBatchAsync(CancellationToken cancellationToken = default)
    {
        if (!_settings.Enabled)
            return default;

        var now = timeProvider.GetUtcNow().UtcDateTime;
        var materialized = await ProcessMaterializationsAsync(now, cancellationToken);
        var published = await ProcessPublicationsAsync(timeProvider.GetUtcNow().UtcDateTime, cancellationToken);
        return new EmailRelayBatchResult(materialized, published, materialized + published);
    }

    private async Task<int> ProcessMaterializationsAsync(DateTime now, CancellationToken cancellationToken)
    {
        var candidateIds = await dbContext.EmailIntents
            .AsNoTracking()
            .Where(intent =>
                (intent.State == EmailIntentState.PendingMaterialization ||
                 intent.State == EmailIntentState.MaterializationRetry) &&
                (intent.NextMaterializationAt == null || intent.NextMaterializationAt <= now) ||
                intent.State == EmailIntentState.Materializing &&
                intent.MaterializationLeaseUntil != null &&
                intent.MaterializationLeaseUntil <= now)
            .OrderBy(intent => intent.NextMaterializationAt)
            .ThenBy(intent => intent.Id)
            .Select(intent => intent.Id)
            .Take(_settings.RelayBatchSize)
            .ToListAsync(cancellationToken);

        var processed = 0;
        foreach (var intentId in candidateIds)
        {
            var token = Guid.NewGuid().ToString("N");
            var leaseUntil = now.AddSeconds(_settings.RelayLeaseSeconds);
            var claimed = await dbContext.EmailIntents
                .Where(intent => intent.Id == intentId)
                .Where(intent =>
                    (intent.State == EmailIntentState.PendingMaterialization ||
                     intent.State == EmailIntentState.MaterializationRetry) &&
                    (intent.NextMaterializationAt == null || intent.NextMaterializationAt <= now) ||
                    intent.State == EmailIntentState.Materializing &&
                    intent.MaterializationLeaseUntil != null &&
                    intent.MaterializationLeaseUntil <= now)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(intent => intent.State, EmailIntentState.Materializing)
                    .SetProperty(intent => intent.MaterializationLeaseToken, token)
                    .SetProperty(intent => intent.MaterializationLeaseUntil, leaseUntil)
                    .SetProperty(intent => intent.MaterializationAttemptCount,
                        intent => intent.MaterializationAttemptCount + 1)
                    .SetProperty(intent => intent.UpdatedAt, now), cancellationToken);
            if (claimed == 0)
                continue;

            processed++;
            dbContext.ChangeTracker.Clear();
            var intent = await dbContext.EmailIntents.SingleAsync(
                candidate => candidate.Id == intentId &&
                             candidate.State == EmailIntentState.Materializing &&
                             candidate.MaterializationLeaseToken == token,
                cancellationToken);
            await MaterializeClaimAsync(intent, now, cancellationToken);
            dbContext.ChangeTracker.Clear();
        }

        return processed;
    }

    private async Task MaterializeClaimAsync(
        EmailIntent intent,
        DateTime now,
        CancellationToken cancellationToken)
    {
        try
        {
            var payload = ParsePayload(intent.RequestPayloadJson);
            string? authLink = null;
            if (intent.IntentKind == EmailIntentKind.FirebaseAuthAction)
            {
                if (!intent.AuthActionType.HasValue || string.IsNullOrWhiteSpace(intent.ContinueUrl))
                    throw new EmailIntentValidationException("The persisted Firebase Auth action request is incomplete.");

                authLink = await authLinkGenerator.GenerateAsync(
                    new EmailAuthActionLinkRequest
                    {
                        ActionType = intent.AuthActionType.Value,
                        RecipientAddress = intent.RecipientAddress,
                        ContinueUrl = intent.ContinueUrl
                    },
                    cancellationToken);
            }

            var definition = await templateCatalog.GetDefinitionAsync(intent.MessageType, cancellationToken);
            if (definition.Template.Version != intent.TemplateVersion)
                throw new EmailIntentValidationException("The persisted template version is not available in the catalog.");
            var bound = templateCatalog.Bind(
                definition,
                new EmailMessageTemplateValues
                {
                    Inputs = payload.Inputs,
                    AuthActionLink = authLink,
                    CustomSubject = payload.CustomSubject,
                    CustomBody = payload.CustomHtml is null
                        ? null
                        : TrustedEmailHtmlValue.FromTrustedSource(payload.CustomHtml, payload.CustomText!)
                });
            var allowlistHosts = _settings.ContinueUrlAllowedHosts.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(_settings.FirebaseProjectId))
            {
                var projectId = _settings.FirebaseProjectId.Trim();
                allowlistHosts = allowlistHosts.Concat(
                    [$"{projectId}.firebaseapp.com", $"{projectId}.web.app"]);
            }
            var allowlist = new EmailUrlAllowlist(allowlistHosts);
            var rendered = templateRenderer.Render(bound.Definition.Template, bound.Parameters, allowlist);
            var sendBefore = now.Add(bound.Definition.SendWithin);
            intent.RecordMaterializedEnvelope(
                new EmailEnvelopeHashInput
                {
                    RecipientAddress = intent.RecipientAddress,
                    Subject = rendered.Subject,
                    HtmlBody = rendered.HtmlBody,
                    TextBody = rendered.TextBody,
                    ActionLink = authLink,
                    SendBefore = sendBefore
                },
                now);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            logger.LogInformation("Email intent {IntentId} lost its materialization fence", intent.Id);
        }
        catch (EmailIntentValidationException)
        {
            await FinishMaterializationFailureAsync(intent, now, "ConfigurationInvalid", retryable: false, cancellationToken);
        }
        catch (EmailTemplateRenderException)
        {
            await FinishMaterializationFailureAsync(intent, now, "TemplateInvalid", retryable: false, cancellationToken);
        }
        catch (JsonException)
        {
            await FinishMaterializationFailureAsync(intent, now, "PersistedPayloadInvalid", retryable: false, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            await FinishMaterializationFailureAsync(intent, now, "FirebaseActionUnavailable", retryable: true, cancellationToken);
        }
    }

    private async Task<int> ProcessPublicationsAsync(DateTime now, CancellationToken cancellationToken)
    {
        var candidateIds = await dbContext.EmailIntents
            .AsNoTracking()
            .Where(intent =>
                (intent.State == EmailIntentState.ReadyToPublish ||
                 intent.State == EmailIntentState.PublishRetry) &&
                (intent.NextPublishAt == null || intent.NextPublishAt <= now) ||
                intent.State == EmailIntentState.Publishing &&
                intent.PublishLeaseUntil != null &&
                intent.PublishLeaseUntil <= now)
            .OrderBy(intent => intent.NextPublishAt)
            .ThenBy(intent => intent.Id)
            .Select(intent => intent.Id)
            .Take(_settings.RelayBatchSize)
            .ToListAsync(cancellationToken);

        var processed = 0;
        foreach (var intentId in candidateIds)
        {
            var token = Guid.NewGuid().ToString("N");
            var leaseUntil = now.AddSeconds(_settings.RelayLeaseSeconds);
            var claimed = await dbContext.EmailIntents
                .Where(intent => intent.Id == intentId)
                .Where(intent =>
                    (intent.State == EmailIntentState.ReadyToPublish ||
                     intent.State == EmailIntentState.PublishRetry) &&
                    (intent.NextPublishAt == null || intent.NextPublishAt <= now) ||
                    intent.State == EmailIntentState.Publishing &&
                    intent.PublishLeaseUntil != null &&
                    intent.PublishLeaseUntil <= now)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(intent => intent.State, EmailIntentState.Publishing)
                    .SetProperty(intent => intent.PublishLeaseToken, token)
                    .SetProperty(intent => intent.PublishLeaseUntil, leaseUntil)
                    .SetProperty(intent => intent.PublishAttemptCount,
                        intent => intent.PublishAttemptCount + 1)
                    .SetProperty(intent => intent.UpdatedAt, now), cancellationToken);
            if (claimed == 0)
                continue;

            processed++;
            dbContext.ChangeTracker.Clear();
            var intent = await dbContext.EmailIntents.SingleAsync(
                candidate => candidate.Id == intentId &&
                             candidate.State == EmailIntentState.Publishing &&
                             candidate.PublishLeaseToken == token,
                cancellationToken);
            await PublishClaimAsync(intent, now, cancellationToken);
            dbContext.ChangeTracker.Clear();
        }

        return processed;
    }

    private async Task PublishClaimAsync(
        EmailIntent intent,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (intent.SendBefore <= now)
        {
            await FinishPublishFailureAsync(intent, now, "ContentExpiredBeforePublish", retryable: false, cancellationToken);
            return;
        }

        try
        {
            if (intent.EnvelopeHash is null || intent.Subject is null || intent.HtmlBody is null || !intent.SendBefore.HasValue)
                throw new EmailIntentValidationException("The frozen email envelope is incomplete.");

            var result = await outboxPublisher.PublishAsync(
                new EmailOutboxPublishRequest(
                    new EmailOutboxEnvelope
                    {
                        IntentId = intent.Id,
                        RequestHash = intent.RequestHash,
                        EnvelopeHash = intent.EnvelopeHash,
                        MessageType = intent.MessageType,
                        DeliveryClass = intent.DeliveryClass,
                        DedupeKey = intent.DedupeKey,
                        Recipient = intent.RecipientAddress,
                        From = _settings.FromAddress,
                        ReplyTo = _settings.ReplyToAddress,
                        Subject = intent.Subject,
                        HtmlBody = intent.HtmlBody,
                        TextBody = intent.TextBody,
                        SendBefore = intent.SendBefore,
                        CorrelationId = intent.CorrelationId,
                        UserId = intent.OwnerType == EmailIntentOwnerType.User ? intent.OwnerId : null,
                        MerchantId = intent.OwnerType == EmailIntentOwnerType.Merchant ? intent.OwnerId : null
                    }),
                cancellationToken);

            if (result.IntentId != intent.Id || result.Outcome == EmailOutboxPublishOutcome.Conflict)
            {
                await FinishPublishConflictAsync(intent, now, cancellationToken);
                return;
            }

            intent.State = EmailIntentState.Published;
            intent.PublishedAt = now;
            intent.PublishLeaseToken = null;
            intent.PublishLeaseUntil = null;
            intent.NextPublishAt = null;
            ClearError(intent, now);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            logger.LogInformation("Email intent {IntentId} lost its publish fence", intent.Id);
        }
        catch (EmailIntentValidationException)
        {
            await FinishPublishFailureAsync(intent, now, "EnvelopeInvalid", retryable: false, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception)
        {
            await FinishPublishFailureAsync(intent, now, "FirestoreUnavailable", retryable: true, cancellationToken);
        }
    }

    private async Task FinishMaterializationFailureAsync(
        EmailIntent intent,
        DateTime now,
        string safeCode,
        bool retryable,
        CancellationToken cancellationToken)
    {
        var exhausted = intent.MaterializationAttemptCount >= _settings.RelayMaximumAttempts;
        intent.State = retryable && !exhausted
            ? EmailIntentState.MaterializationRetry
            : safeCode == "ConfigurationInvalid" || safeCode == "TemplateInvalid"
                ? EmailIntentState.ConfigurationInvalid
                : EmailIntentState.MaterializationFailed;
        intent.NextMaterializationAt = retryable && !exhausted
            ? now.Add(ComputeBackoff(intent.MaterializationAttemptCount))
            : null;
        intent.MaterializationLeaseToken = null;
        intent.MaterializationLeaseUntil = null;
        SetError(intent, "Materialization", exhausted ? "RetryExhausted" : safeCode, now);
        await SaveFencedFailureAsync(intent, cancellationToken);
    }

    private async Task FinishPublishFailureAsync(
        EmailIntent intent,
        DateTime now,
        string safeCode,
        bool retryable,
        CancellationToken cancellationToken)
    {
        var exhausted = intent.PublishAttemptCount >= _settings.RelayMaximumAttempts;
        var expired = intent.SendBefore <= now;
        intent.State = retryable && !exhausted && !expired
            ? EmailIntentState.PublishRetry
            : EmailIntentState.PublishFailed;
        intent.NextPublishAt = retryable && !exhausted && !expired
            ? now.Add(ComputeBackoff(intent.PublishAttemptCount))
            : null;
        intent.PublishLeaseToken = null;
        intent.PublishLeaseUntil = null;
        SetError(intent, "Publish", exhausted ? "RetryExhausted" : safeCode, now);
        await SaveFencedFailureAsync(intent, cancellationToken);
    }

    private async Task FinishPublishConflictAsync(
        EmailIntent intent,
        DateTime now,
        CancellationToken cancellationToken)
    {
        intent.State = EmailIntentState.PublishConflict;
        intent.NextPublishAt = null;
        intent.PublishLeaseToken = null;
        intent.PublishLeaseUntil = null;
        SetError(intent, "Publish", "EnvelopeHashConflict", now);
        await SaveFencedFailureAsync(intent, cancellationToken);
    }

    private async Task SaveFencedFailureAsync(EmailIntent intent, CancellationToken cancellationToken)
    {
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            logger.LogInformation("Email intent {IntentId} failure result lost its fence", intent.Id);
        }
    }

    private TimeSpan ComputeBackoff(int attempt)
    {
        var exponent = Math.Clamp(attempt - 1, 0, 20);
        var seconds = Math.Min(
            _settings.RelayRetryMaximumSeconds,
            _settings.RelayRetryBaseSeconds * Math.Pow(2, exponent));
        var jitter = 0.8 + Random.Shared.NextDouble() * 0.4;
        return TimeSpan.FromSeconds(seconds * jitter);
    }

    private static FrozenIntentPayload ParsePayload(string json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        var inputs = new Dictionary<string, string>(StringComparer.Ordinal);
        if (root.TryGetProperty("inputs", out var inputObject))
        {
            foreach (var property in inputObject.EnumerateObject())
                inputs.Add(property.Name, property.Value.GetString() ?? string.Empty);
        }

        string? subject = null;
        string? html = null;
        string? text = null;
        if (root.TryGetProperty("customHtml", out var customHtml) && customHtml.ValueKind != JsonValueKind.Null)
        {
            subject = customHtml.GetProperty("subject").GetString();
            html = customHtml.GetProperty("html").GetString();
            text = customHtml.GetProperty("text").GetString();
        }

        return new FrozenIntentPayload(inputs, subject, html, text);
    }

    private static void SetError(EmailIntent intent, string errorClass, string errorCode, DateTime now)
    {
        intent.LastErrorClass = errorClass;
        intent.LastErrorCode = errorCode;
        intent.LastErrorAt = now;
        intent.UpdatedAt = now;
    }

    private static void ClearError(EmailIntent intent, DateTime now)
    {
        intent.LastErrorClass = null;
        intent.LastErrorCode = null;
        intent.LastErrorAt = null;
        intent.UpdatedAt = now;
    }

    private sealed record FrozenIntentPayload(
        IReadOnlyDictionary<string, string> Inputs,
        string? CustomSubject,
        string? CustomHtml,
        string? CustomText);
}

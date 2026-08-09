using System.Globalization;
using System.Threading.Channels;
using Google.Cloud.Firestore;
using Microsoft.Extensions.Options;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Settings;

namespace swiftpay_api_core.Services;

public sealed class FirestoreEmailOutboxStore : IEmailOutboxPublisher, IEmailOutboxStore, IEmailOutboxStatusReader
{
    private static readonly string[] Terminal = ["Accepted", "Failed", "DeadLetter", "DeliveryUnknown"];
    private readonly FirestoreDb _db;
    private readonly EmailPlatformSettings _settings;

    public FirestoreEmailOutboxStore(FirestoreDb db, IOptions<EmailPlatformSettings> settings)
    {
        _db = db;
        _settings = settings.Value;
    }

    private CollectionReference Outbox => _db.Collection(_settings.OutboxCollection);
    private CollectionReference Quotas => _db.Collection(_settings.QuotaCollection);
    private CollectionReference Reservations => _db.Collection(_settings.QuotaReservationCollection);
    private DocumentReference ProviderControl => _db.Collection(_settings.ControlCollection).Document("resend");

    public Task<EmailOutboxPublishResult> PublishAsync(EmailOutboxPublishRequest request, CancellationToken cancellationToken = default)
    {
        Validate(request.Envelope);
        var envelope = request.Envelope;
        var reference = Outbox.Document(envelope.IntentId.ToString("N"));
        var now = DateTime.UtcNow;
        return _db.RunTransactionAsync(async transaction =>
        {
            var existing = await transaction.GetSnapshotAsync(reference);
            if (existing.Exists)
            {
                var same = existing.GetValue<string>("requestHash") == envelope.RequestHash &&
                           existing.GetValue<string>("envelopeHash") == envelope.EnvelopeHash;
                return new EmailOutboxPublishResult(envelope.IntentId,
                    same ? EmailOutboxPublishOutcome.AlreadyPublished : EmailOutboxPublishOutcome.Conflict,
                    Enum.Parse<EmailOutboxStatus>(existing.GetValue<string>("status")));
            }

            transaction.Create(reference, NewDocument(envelope, now, _settings.MaximumRetryableFailures));
            return new EmailOutboxPublishResult(envelope.IntentId, EmailOutboxPublishOutcome.Created, EmailOutboxStatus.Queued);
        }, cancellationToken: cancellationToken);
    }

    public async IAsyncEnumerable<Guid> ListenForQueuedAsync(
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var channel = Channel.CreateBounded<Guid>(Math.Max(1, _settings.WorkerBatchSize * 2));
        var listener = Outbox.WhereEqualTo("status", "Queued").Listen(snapshot =>
        {
            foreach (var change in snapshot.Changes)
            {
                if (change.ChangeType != DocumentChange.Type.Removed && Guid.TryParseExact(change.Document.Id, "N", out var id))
                    channel.Writer.TryWrite(id);
            }
        });
        using var registration = cancellationToken.Register(() => channel.Writer.TryComplete());
        try
        {
            await foreach (var id in channel.Reader.ReadAllAsync(cancellationToken)) yield return id;
        }
        finally
        {
            await listener.StopAsync(CancellationToken.None);
        }
    }

    public async Task<IReadOnlyList<Guid>> FindRecoverableAsync(DateTime nowUtc, int limit, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        var ids = new HashSet<Guid>();
        var take = Math.Clamp(limit, 1, 200);
        await AddIdsAsync(Outbox.WhereEqualTo("status", "RetryScheduled").WhereLessThanOrEqualTo("nextAttemptAt", nowUtc).Limit(take), ids, cancellationToken);
        if (ids.Count < take)
            await AddIdsAsync(Outbox.WhereEqualTo("status", "Processing").WhereLessThanOrEqualTo("leaseExpiresAt", nowUtc).Limit(take - ids.Count), ids, cancellationToken);
        return ids.ToArray();
    }

    public Task<EmailOutboxClaimResult> TryClaimAsync(Guid intentId, string leaseOwner, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        ArgumentException.ThrowIfNullOrWhiteSpace(leaseOwner);
        var reference = Outbox.Document(intentId.ToString("N"));
        var leaseToken = Guid.NewGuid().ToString("N");
        return _db.RunTransactionAsync(async transaction =>
        {
            var document = await transaction.GetSnapshotAsync(reference);
            var control = await transaction.GetSnapshotAsync(ProviderControl);
            if (!document.Exists) return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.NotFound, null);
            var current = Read(document);
            if (IsTerminal(current.Status)) return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.Ineligible, current);
            if (OptionalDate(control, "pausedUntil") > nowUtc) return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.ProviderPaused, current);

            var expiredLease = current.Status == EmailOutboxStatus.Processing && current.LeaseExpiresAt <= nowUtc;
            var eligible = current.Status == EmailOutboxStatus.Queued ||
                           current.Status == EmailOutboxStatus.RetryScheduled && current.NextAttemptAt <= nowUtc || expiredLease;
            if (!eligible) return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.Ineligible, current);

            var unknown = current.AcceptanceUnknown || expiredLease && current.FirstProviderAttemptAt.HasValue;
            var ambiguous = current.AmbiguousAttemptCount + (expiredLease && current.FirstProviderAttemptAt.HasValue && !current.AcceptanceUnknown ? 1 : 0);
            if (unknown && MustStopAmbiguous(current, ambiguous, nowUtc))
            {
                transaction.Update(reference, TerminalUpdate(EmailOutboxStatus.DeliveryUnknown, "ProviderAcceptanceUnknown", "DeliveryUnknown", nowUtc, true, ambiguous));
                return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.Terminalized, current);
            }

            if (!unknown && (current.Envelope.SendBefore <= nowUtc || current.RetryableFailureCount >= _settings.MaximumRetryableFailures))
            {
                var release = await LoadReleaseAsync(transaction, current, intentId);
                var code = current.Envelope.SendBefore <= nowUtc ? "ContentExpired" : "RetryExhausted";
                transaction.Update(reference, TerminalUpdate(EmailOutboxStatus.DeadLetter, code, code, nowUtc));
                Release(transaction, release, nowUtc);
                return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.Terminalized, current);
            }

            var quota = await LoadQuotaAsync(transaction, current, intentId, nowUtc);
            if (!quota.Available)
            {
                var resume = nowUtc.Date.AddDays(1);
                transaction.Update(reference, RetryUpdate("Quota", current.Envelope.DeliveryClass == EmailDeliveryClass.Notification ? "NotificationQuotaExhausted" : "DailyQuotaExhausted", resume, nowUtc, current.RetryableFailureCount, ambiguous, unknown));
                if (quota.PauseGlobally) transaction.Set(ProviderControl, new Dictionary<string, object> { ["pausedUntil"] = resume, ["reason"] = "DailyQuotaExhausted", ["updatedAt"] = nowUtc }, SetOptions.MergeAll);
                return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.QuotaUnavailable, current);
            }

            ClaimQuota(transaction, quota, current, intentId, nowUtc);
            var leaseUntil = nowUtc.AddSeconds(_settings.LeaseSeconds);
            transaction.Update(reference, new Dictionary<string, object>
            {
                ["status"] = "Processing", ["attemptCount"] = current.AttemptCount + 1,
                ["ambiguousAttemptCount"] = ambiguous, ["acceptanceUnknown"] = unknown,
                ["leaseOwner"] = leaseOwner, ["leaseToken"] = leaseToken, ["leaseExpiresAt"] = leaseUntil,
                ["quotaReservationDay"] = quota.Day, ["quotaReservationClass"] = current.Envelope.DeliveryClass.ToString(),
                ["quotaReservationState"] = "Claimed", ["updatedAt"] = nowUtc
            });
            return new EmailOutboxClaimResult(EmailOutboxClaimOutcome.Claimed, current with
            {
                Status = EmailOutboxStatus.Processing, AttemptCount = current.AttemptCount + 1,
                AmbiguousAttemptCount = ambiguous, AcceptanceUnknown = unknown, LeaseOwner = leaseOwner,
                LeaseToken = leaseToken, LeaseExpiresAt = leaseUntil, QuotaReservationDay = quota.Day,
                QuotaReservationClass = current.Envelope.DeliveryClass, QuotaReservationState = EmailQuotaReservationState.Claimed,
                UpdatedAt = nowUtc
            });
        }, cancellationToken: cancellationToken);
    }

    public Task<EmailOutboxTransitionResult> RenewLeaseAsync(Guid intentId, string leaseToken, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        return FencedAsync(intentId, leaseToken, cancellationToken, (tx, doc, _) =>
        {
            tx.Update(doc, new Dictionary<string, object> { ["leaseExpiresAt"] = nowUtc.AddSeconds(_settings.LeaseSeconds), ["updatedAt"] = nowUtc });
            return new(true, EmailOutboxStatus.Processing);
        });
    }

    public Task<EmailOutboxSnapshot?> PrepareProviderAttemptAsync(Guid intentId, string leaseToken, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        var reference = Outbox.Document(intentId.ToString("N"));
        return _db.RunTransactionAsync<EmailOutboxSnapshot?>(async transaction =>
        {
            var document = await transaction.GetSnapshotAsync(reference);
            if (!document.Exists) return null;
            var current = Read(document);
            if (!Fenced(current, leaseToken) || current.LeaseExpiresAt - nowUtc < TimeSpan.FromSeconds(_settings.MinimumLeaseBeforeProviderSeconds)) return null;
            var first = current.FirstProviderAttemptAt ?? nowUtc;
            var expires = current.IdempotencyExpiresAt ?? first.AddHours(_settings.ProviderIdempotencyWindowHours);
            transaction.Update(reference, new Dictionary<string, object> { ["firstProviderAttemptAt"] = first, ["idempotencyExpiresAt"] = expires, ["updatedAt"] = nowUtc });
            return current with { FirstProviderAttemptAt = first, IdempotencyExpiresAt = expires, UpdatedAt = nowUtc };
        }, cancellationToken: cancellationToken);
    }

    public Task<EmailOutboxTransitionResult> FinalizeAcceptedAsync(Guid intentId, string leaseToken, string providerMessageId, DateTime acceptedAtUtc, CancellationToken cancellationToken = default)
    {
        Utc(acceptedAtUtc);
        ArgumentException.ThrowIfNullOrWhiteSpace(providerMessageId);
        return FencedAsync(intentId, leaseToken, cancellationToken, (tx, doc, _) =>
        {
            tx.Update(doc, new Dictionary<string, object>
            {
                ["status"] = "Accepted", ["providerMessageId"] = providerMessageId, ["providerAcceptedAt"] = acceptedAtUtc,
                ["leaseOwner"] = FieldValue.Delete, ["leaseToken"] = FieldValue.Delete, ["leaseExpiresAt"] = FieldValue.Delete,
                ["lastErrorClass"] = FieldValue.Delete, ["lastErrorCode"] = FieldValue.Delete, ["updatedAt"] = acceptedAtUtc
            });
            return new(true, EmailOutboxStatus.Accepted);
        });
    }

    public Task<EmailOutboxTransitionResult> FinalizePermanentFailureAsync(Guid intentId, string leaseToken, string safeErrorClass, string safeErrorCode, DateTime nowUtc, CancellationToken cancellationToken = default) =>
        FailAsync(intentId, leaseToken, safeErrorClass, safeErrorCode, nowUtc, null, permanent: true, ambiguous: false, cancellationToken);

    public Task<EmailOutboxTransitionResult> ScheduleRetryAsync(Guid intentId, string leaseToken, string safeErrorClass, string safeErrorCode, DateTime nextAttemptAtUtc, DateTime nowUtc, CancellationToken cancellationToken = default) =>
        FailAsync(intentId, leaseToken, safeErrorClass, safeErrorCode, nowUtc, nextAttemptAtUtc, permanent: false, ambiguous: false, cancellationToken);

    public Task<EmailOutboxTransitionResult> ScheduleAmbiguousRetryAsync(Guid intentId, string leaseToken, string safeErrorClass, string safeErrorCode, DateTime nextAttemptAtUtc, DateTime nowUtc, CancellationToken cancellationToken = default) =>
        FailAsync(intentId, leaseToken, safeErrorClass, safeErrorCode, nowUtc, nextAttemptAtUtc, permanent: false, ambiguous: true, cancellationToken);

    public Task<EmailOutboxTransitionResult> PauseForRateLimitAsync(Guid intentId, string leaseToken, DateTime pausedUntilUtc, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        Utc(pausedUntilUtc); Utc(nowUtc);
        var reference = Outbox.Document(intentId.ToString("N"));
        return _db.RunTransactionAsync(async transaction =>
        {
            var document = await transaction.GetSnapshotAsync(reference);
            var control = await transaction.GetSnapshotAsync(ProviderControl);
            if (!document.Exists) return new EmailOutboxTransitionResult(false, null);
            var current = Read(document);
            if (!Fenced(current, leaseToken)) return new(false, current.Status);
            var pause = OptionalDate(control, "pausedUntil") is { } existing && existing > pausedUntilUtc ? existing : pausedUntilUtc;
            transaction.Set(ProviderControl, new Dictionary<string, object> { ["pausedUntil"] = pause, ["reason"] = "ProviderRateLimited", ["updatedAt"] = nowUtc }, SetOptions.MergeAll);
            transaction.Update(reference, RetryUpdate("ProviderRateLimit", "RateLimited", pause, nowUtc, current.RetryableFailureCount, current.AmbiguousAttemptCount, current.AcceptanceUnknown));
            return new(true, EmailOutboxStatus.RetryScheduled);
        }, cancellationToken: cancellationToken);
    }

    public async Task<DateTime?> GetProviderPausedUntilAsync(CancellationToken cancellationToken = default) =>
        OptionalDate(await ProviderControl.GetSnapshotAsync(cancellationToken), "pausedUntil");

    public async Task<EmailOutboxSnapshot?> GetAsync(Guid intentId, CancellationToken cancellationToken = default)
    {
        var document = await Outbox.Document(intentId.ToString("N")).GetSnapshotAsync(cancellationToken);
        return document.Exists ? Read(document) : null;
    }

    public async Task<IReadOnlyList<EmailOutboxCleanupCandidate>> FindCleanupCandidatesAsync(DateTime nowUtc, int limit, string? pageToken, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        Query query = Outbox.WhereIn("status", Terminal).WhereLessThanOrEqualTo("updatedAt", nowUtc.AddDays(-_settings.PayloadRetentionDays))
            .OrderBy("updatedAt").OrderBy(FieldPath.DocumentId).Limit(Math.Clamp(limit, 1, 200));
        if (ParseToken(pageToken, out var time, out var id)) query = query.StartAfter(time, id);
        var result = new List<EmailOutboxCleanupCandidate>();
        await foreach (var document in query.StreamAsync(cancellationToken))
        {
            if (!Guid.TryParseExact(document.Id, "N", out var intentId)) continue;
            var status = Enum.Parse<EmailOutboxStatus>(document.GetValue<string>("status"));
            var updated = document.GetValue<DateTime>("updatedAt").ToUniversalTime();
            result.Add(new(intentId, status, OptionalString(document, "lastErrorCode"),
                OptionalDate(document, status == EmailOutboxStatus.Accepted ? "providerAcceptedAt" : "deadLetteredAt") ?? updated,
                OptionalDate(document, "providerAcceptedAt"), OptionalBool(document, "payloadRedacted"), updated));
        }
        return result;
    }

    public Task<bool> RedactTerminalPayloadAsync(Guid intentId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        var reference = Outbox.Document(intentId.ToString("N"));
        return _db.RunTransactionAsync(async tx =>
        {
            var doc = await tx.GetSnapshotAsync(reference);
            if (!doc.Exists) return false;
            var status = Enum.Parse<EmailOutboxStatus>(doc.GetValue<string>("status"));
            if (status is not (EmailOutboxStatus.DeadLetter or EmailOutboxStatus.DeliveryUnknown) || doc.GetValue<DateTime>("updatedAt").ToUniversalTime() > nowUtc.AddDays(-_settings.PayloadRetentionDays)) return false;
            if (OptionalBool(doc, "payloadRedacted")) return true;
            tx.Update(reference, new Dictionary<string, object>
            {
                ["to"] = FieldValue.Delete, ["subject"] = FieldValue.Delete, ["htmlBody"] = FieldValue.Delete,
                ["textBody"] = FieldValue.Delete, ["replyTo"] = FieldValue.Delete, ["payloadRedacted"] = true, ["payloadRedactedAt"] = nowUtc
            });
            return true;
        }, cancellationToken: cancellationToken);
    }

    public Task<bool> DeleteTerminalAsync(Guid intentId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        Utc(nowUtc);
        var reference = Outbox.Document(intentId.ToString("N"));
        return _db.RunTransactionAsync(async tx =>
        {
            var doc = await tx.GetSnapshotAsync(reference);
            if (!doc.Exists) return true;
            var status = Enum.Parse<EmailOutboxStatus>(doc.GetValue<string>("status"));
            var updated = doc.GetValue<DateTime>("updatedAt").ToUniversalTime();
            var allowed = status is EmailOutboxStatus.Accepted or EmailOutboxStatus.Failed
                ? updated <= nowUtc.AddDays(-_settings.PayloadRetentionDays)
                : status is EmailOutboxStatus.DeadLetter or EmailOutboxStatus.DeliveryUnknown && OptionalBool(doc, "payloadRedacted") && updated <= nowUtc.AddDays(-_settings.SafeMetadataRetentionDays);
            if (!allowed) return false;
            tx.Delete(reference);
            return true;
        }, cancellationToken: cancellationToken);
    }

    private Task<EmailOutboxTransitionResult> FailAsync(Guid intentId, string leaseToken, string errorClass, string errorCode, DateTime nowUtc, DateTime? nextUtc, bool permanent, bool ambiguous, CancellationToken cancellationToken)
    {
        Utc(nowUtc); if (nextUtc.HasValue) Utc(nextUtc.Value);
        errorClass = Safe(errorClass); errorCode = Safe(errorCode);
        var reference = Outbox.Document(intentId.ToString("N"));
        return _db.RunTransactionAsync(async tx =>
        {
            var doc = await tx.GetSnapshotAsync(reference);
            if (!doc.Exists) return new EmailOutboxTransitionResult(false, null);
            var current = Read(doc);
            if (!Fenced(current, leaseToken)) return new(false, current.Status);
            if (permanent)
            {
                var release = await LoadReleaseAsync(tx, current, intentId);
                tx.Update(reference, TerminalUpdate(EmailOutboxStatus.Failed, errorClass, errorCode, nowUtc));
                Release(tx, release, nowUtc);
                return new(true, EmailOutboxStatus.Failed);
            }
            if (ambiguous)
            {
                var count = current.AmbiguousAttemptCount + 1;
                if (MustStopAmbiguous(current, count, nowUtc))
                {
                    tx.Update(reference, TerminalUpdate(EmailOutboxStatus.DeliveryUnknown, errorClass, errorCode, nowUtc, true, count));
                    return new(true, EmailOutboxStatus.DeliveryUnknown);
                }
                tx.Update(reference, RetryUpdate(errorClass, errorCode, nextUtc!.Value, nowUtc, current.RetryableFailureCount, count, true));
                return new(true, EmailOutboxStatus.RetryScheduled);
            }
            var retries = current.RetryableFailureCount + 1;
            if (retries >= _settings.MaximumRetryableFailures)
            {
                var release = await LoadReleaseAsync(tx, current, intentId);
                tx.Update(reference, TerminalUpdate(EmailOutboxStatus.DeadLetter, "RetryExhausted", "RetryExhausted", nowUtc));
                Release(tx, release, nowUtc);
                return new(true, EmailOutboxStatus.DeadLetter);
            }
            tx.Update(reference, RetryUpdate(errorClass, errorCode, nextUtc!.Value, nowUtc, retries, current.AmbiguousAttemptCount, current.AcceptanceUnknown));
            return new(true, EmailOutboxStatus.RetryScheduled);
        }, cancellationToken: cancellationToken);
    }

    private Task<EmailOutboxTransitionResult> FencedAsync(Guid intentId, string token, CancellationToken cancellationToken, Func<Transaction, DocumentReference, EmailOutboxSnapshot, EmailOutboxTransitionResult> apply)
    {
        var reference = Outbox.Document(intentId.ToString("N"));
        return _db.RunTransactionAsync(async tx =>
        {
            var doc = await tx.GetSnapshotAsync(reference);
            if (!doc.Exists) return new EmailOutboxTransitionResult(false, null);
            var current = Read(doc);
            return Fenced(current, token) ? apply(tx, reference, current) : new(false, current.Status);
        }, cancellationToken: cancellationToken);
    }

    private async Task<QuotaClaim> LoadQuotaAsync(Transaction tx, EmailOutboxSnapshot current, Guid intentId, DateTime nowUtc)
    {
        var day = nowUtc.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var reservationRef = Reservations.Document($"{day}-{intentId:N}");
        var quotaRef = Quotas.Document($"resend-{day}");
        var reservation = await tx.GetSnapshotAsync(reservationRef);
        var quota = await tx.GetSnapshotAsync(quotaRef);
        if (reservation.Exists && OptionalString(reservation, "state") == "Claimed") return new(true, false, false, day, reservationRef, quotaRef, 0, 0);
        var total = OptionalInt(quota, "totalClaimed"); var notification = OptionalInt(quota, "notificationClaimed");
        var available = total < _settings.DailyQuota && (current.Envelope.DeliveryClass == EmailDeliveryClass.Critical || notification < _settings.NotificationDailyQuota);
        return new(available, !available && total >= _settings.DailyQuota, available, day, reservationRef, quotaRef, total, notification);
    }

    private static void ClaimQuota(Transaction tx, QuotaClaim quota, EmailOutboxSnapshot current, Guid intentId, DateTime nowUtc)
    {
        if (!quota.Increment) return;
        tx.Set(quota.Quota, new Dictionary<string, object> { ["day"] = quota.Day, ["totalClaimed"] = quota.Total + 1, ["notificationClaimed"] = quota.Notifications + (current.Envelope.DeliveryClass == EmailDeliveryClass.Notification ? 1 : 0), ["updatedAt"] = nowUtc }, SetOptions.MergeAll);
        tx.Set(quota.Reservation, new Dictionary<string, object> { ["intentId"] = intentId.ToString("N"), ["day"] = quota.Day, ["deliveryClass"] = current.Envelope.DeliveryClass.ToString(), ["state"] = "Claimed", ["claimedAt"] = nowUtc, ["updatedAt"] = nowUtc });
    }

    private async Task<QuotaRelease?> LoadReleaseAsync(Transaction tx, EmailOutboxSnapshot current, Guid intentId)
    {
        if (current.QuotaReservationState != EmailQuotaReservationState.Claimed || current.QuotaReservationDay is null) return null;
        var reservationRef = Reservations.Document($"{current.QuotaReservationDay}-{intentId:N}");
        var quotaRef = Quotas.Document($"resend-{current.QuotaReservationDay}");
        var reservation = await tx.GetSnapshotAsync(reservationRef); var quota = await tx.GetSnapshotAsync(quotaRef);
        return reservation.Exists && OptionalString(reservation, "state") == "Claimed"
            ? new(reservationRef, quotaRef, OptionalInt(quota, "totalClaimed"), OptionalInt(quota, "notificationClaimed"), current.Envelope.DeliveryClass) : null;
    }

    private static void Release(Transaction tx, QuotaRelease? release, DateTime nowUtc)
    {
        if (release is null) return;
        tx.Update(release.Reservation, new Dictionary<string, object> { ["state"] = "Released", ["releasedAt"] = nowUtc, ["updatedAt"] = nowUtc });
        tx.Set(release.Quota, new Dictionary<string, object> { ["totalClaimed"] = Math.Max(0, release.Total - 1), ["notificationClaimed"] = Math.Max(0, release.Notifications - (release.Class == EmailDeliveryClass.Notification ? 1 : 0)), ["updatedAt"] = nowUtc }, SetOptions.MergeAll);
    }

    private bool MustStopAmbiguous(EmailOutboxSnapshot current, int count, DateTime nowUtc) =>
        count >= _settings.MaximumAmbiguousAttempts || current.IdempotencyExpiresAt <= nowUtc || current.Envelope.SendBefore <= nowUtc;

    private static Dictionary<string, object> NewDocument(EmailOutboxEnvelope e, DateTime now, int maxFailures)
    {
        var result = new Dictionary<string, object>
        {
            ["schemaVersion"] = e.SchemaVersion, ["intentId"] = e.IntentId.ToString("N"), ["requestHash"] = e.RequestHash,
            ["envelopeHash"] = e.EnvelopeHash, ["messageType"] = e.MessageType.ToString(), ["deliveryClass"] = e.DeliveryClass.ToString(),
            ["dedupeKey"] = e.DedupeKey, ["to"] = new[] { e.Recipient }, ["from"] = e.From, ["subject"] = e.Subject,
            ["htmlBody"] = e.HtmlBody, ["status"] = "Queued", ["createdAt"] = now, ["updatedAt"] = now,
            ["nextAttemptAt"] = now, ["attemptCount"] = 0, ["retryableFailureCount"] = 0, ["ambiguousAttemptCount"] = 0,
            ["acceptanceUnknown"] = false, ["maxRetryableFailures"] = maxFailures, ["correlationId"] = e.CorrelationId, ["payloadRedacted"] = false
        };
        Add(result, "replyTo", e.ReplyTo); Add(result, "textBody", e.TextBody); Add(result, "sendBefore", e.SendBefore);
        Add(result, "userId", e.UserId?.ToString("N")); Add(result, "merchantId", e.MerchantId?.ToString("N"));
        return result;
    }

    private static EmailOutboxSnapshot Read(DocumentSnapshot d)
    {
        var to = d.ContainsField("to") ? d.GetValue<IReadOnlyList<string>>("to") : [];
        var envelope = new EmailOutboxEnvelope
        {
            SchemaVersion = d.GetValue<int>("schemaVersion"), IntentId = Guid.ParseExact(d.GetValue<string>("intentId"), "N"),
            RequestHash = d.GetValue<string>("requestHash"), EnvelopeHash = d.GetValue<string>("envelopeHash"),
            MessageType = Enum.Parse<EmailMessageType>(d.GetValue<string>("messageType")), DeliveryClass = Enum.Parse<EmailDeliveryClass>(d.GetValue<string>("deliveryClass")),
            DedupeKey = d.GetValue<string>("dedupeKey"), Recipient = to.FirstOrDefault() ?? string.Empty, From = OptionalString(d, "from") ?? string.Empty,
            ReplyTo = OptionalString(d, "replyTo"), Subject = OptionalString(d, "subject") ?? string.Empty, HtmlBody = OptionalString(d, "htmlBody") ?? string.Empty,
            TextBody = OptionalString(d, "textBody"), SendBefore = OptionalDate(d, "sendBefore"), CorrelationId = d.GetValue<string>("correlationId"),
            UserId = OptionalGuid(d, "userId"), MerchantId = OptionalGuid(d, "merchantId")
        };
        return new EmailOutboxSnapshot
        {
            Envelope = envelope, Status = Enum.Parse<EmailOutboxStatus>(d.GetValue<string>("status")), AttemptCount = OptionalInt(d, "attemptCount"),
            RetryableFailureCount = OptionalInt(d, "retryableFailureCount"), AmbiguousAttemptCount = OptionalInt(d, "ambiguousAttemptCount"),
            AcceptanceUnknown = OptionalBool(d, "acceptanceUnknown"), NextAttemptAt = OptionalDate(d, "nextAttemptAt") ?? DateTime.UnixEpoch,
            LeaseOwner = OptionalString(d, "leaseOwner"), LeaseToken = OptionalString(d, "leaseToken"), LeaseExpiresAt = OptionalDate(d, "leaseExpiresAt"),
            FirstProviderAttemptAt = OptionalDate(d, "firstProviderAttemptAt"), IdempotencyExpiresAt = OptionalDate(d, "idempotencyExpiresAt"),
            QuotaReservationDay = OptionalString(d, "quotaReservationDay"), QuotaReservationClass = OptionalEnum<EmailDeliveryClass>(d, "quotaReservationClass"),
            QuotaReservationState = OptionalEnum<EmailQuotaReservationState>(d, "quotaReservationState"), ProviderMessageId = OptionalString(d, "providerMessageId"),
            ProviderAcceptedAt = OptionalDate(d, "providerAcceptedAt"), DeadLetteredAt = OptionalDate(d, "deadLetteredAt"), LastErrorClass = OptionalString(d, "lastErrorClass"),
            LastErrorCode = OptionalString(d, "lastErrorCode"), CreatedAt = d.GetValue<DateTime>("createdAt").ToUniversalTime(),
            UpdatedAt = d.GetValue<DateTime>("updatedAt").ToUniversalTime(), PayloadRedacted = OptionalBool(d, "payloadRedacted")
        };
    }

    private static Dictionary<string, object> RetryUpdate(string errorClass, string errorCode, DateTime next, DateTime now, int retries, int ambiguous, bool unknown) => new()
    {
        ["status"] = "RetryScheduled", ["retryableFailureCount"] = retries, ["ambiguousAttemptCount"] = ambiguous, ["acceptanceUnknown"] = unknown,
        ["nextAttemptAt"] = next, ["leaseOwner"] = FieldValue.Delete, ["leaseToken"] = FieldValue.Delete, ["leaseExpiresAt"] = FieldValue.Delete,
        ["lastErrorClass"] = errorClass, ["lastErrorCode"] = errorCode, ["updatedAt"] = now
    };

    private static Dictionary<string, object> TerminalUpdate(EmailOutboxStatus status, string errorClass, string errorCode, DateTime now, bool unknown = false, int? ambiguous = null)
    {
        var update = new Dictionary<string, object> { ["status"] = status.ToString(), ["acceptanceUnknown"] = unknown, ["deadLetteredAt"] = now,
            ["leaseOwner"] = FieldValue.Delete, ["leaseToken"] = FieldValue.Delete, ["leaseExpiresAt"] = FieldValue.Delete,
            ["lastErrorClass"] = errorClass, ["lastErrorCode"] = errorCode, ["updatedAt"] = now };
        if (ambiguous.HasValue) update["ambiguousAttemptCount"] = ambiguous.Value;
        return update;
    }

    private static async Task AddIdsAsync(Query query, ISet<Guid> ids, CancellationToken cancellationToken)
    {
        await foreach (var doc in query.StreamAsync(cancellationToken)) if (Guid.TryParseExact(doc.Id, "N", out var id)) ids.Add(id);
    }

    private static bool Fenced(EmailOutboxSnapshot current, string token) => current.Status == EmailOutboxStatus.Processing && current.LeaseToken == token;
    private static bool IsTerminal(EmailOutboxStatus status) => Terminal.Contains(status.ToString(), StringComparer.Ordinal);
    private static string Safe(string value) { ArgumentException.ThrowIfNullOrWhiteSpace(value); return value.Length <= 128 ? value : value[..128]; }
    private static void Utc(DateTime value) { if (value.Kind != DateTimeKind.Utc) throw new ArgumentException("Timestamp must be UTC."); }
    private static void Add(IDictionary<string, object> target, string key, object? value) { if (value is not null) target[key] = value; }
    private static string? OptionalString(DocumentSnapshot d, string f) => d.Exists && d.ContainsField(f) ? d.GetValue<string>(f) : null;
    private static DateTime? OptionalDate(DocumentSnapshot d, string f) => d.Exists && d.ContainsField(f) ? d.GetValue<DateTime>(f).ToUniversalTime() : null;
    private static int OptionalInt(DocumentSnapshot d, string f) => d.Exists && d.ContainsField(f) ? Convert.ToInt32(d.GetValue<long>(f), CultureInfo.InvariantCulture) : 0;
    private static bool OptionalBool(DocumentSnapshot d, string f) => d.Exists && d.ContainsField(f) && d.GetValue<bool>(f);
    private static Guid? OptionalGuid(DocumentSnapshot d, string f) => Guid.TryParseExact(OptionalString(d, f), "N", out var value) ? value : null;
    private static T? OptionalEnum<T>(DocumentSnapshot d, string f) where T : struct, Enum => Enum.TryParse<T>(OptionalString(d, f), out var value) ? value : null;
    private static void Validate(EmailOutboxEnvelope e)
    {
        if (e.IntentId == Guid.Empty || e.SchemaVersion != EmailOutboxEnvelope.CurrentSchemaVersion) throw new ArgumentException("Invalid outbox identity or schema.");
        ArgumentException.ThrowIfNullOrWhiteSpace(e.RequestHash); ArgumentException.ThrowIfNullOrWhiteSpace(e.EnvelopeHash);
        ArgumentException.ThrowIfNullOrWhiteSpace(e.DedupeKey); ArgumentException.ThrowIfNullOrWhiteSpace(e.Recipient);
        ArgumentException.ThrowIfNullOrWhiteSpace(e.From); ArgumentException.ThrowIfNullOrWhiteSpace(e.Subject);
        ArgumentException.ThrowIfNullOrWhiteSpace(e.HtmlBody); ArgumentException.ThrowIfNullOrWhiteSpace(e.CorrelationId);
        if (e.SendBefore.HasValue) Utc(e.SendBefore.Value);
    }
    private static bool ParseToken(string? token, out DateTime time, out string id)
    {
        time = default; id = string.Empty; var parts = token?.Split(':', 2);
        return parts?.Length == 2 && long.TryParse(parts[0], out var ticks) && (time = new DateTime(ticks, DateTimeKind.Utc)) != default && !string.IsNullOrWhiteSpace(id = parts[1]);
    }
    public static string PageToken(EmailOutboxCleanupCandidate item) => $"{item.UpdatedAt.Ticks}:{item.IntentId:N}";

    private sealed record QuotaClaim(bool Available, bool PauseGlobally, bool Increment, string Day, DocumentReference Reservation, DocumentReference Quota, int Total, int Notifications);
    private sealed record QuotaRelease(DocumentReference Reservation, DocumentReference Quota, int Total, int Notifications, EmailDeliveryClass Class);
}

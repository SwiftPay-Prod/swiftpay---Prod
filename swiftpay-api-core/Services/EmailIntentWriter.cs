using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Services;

public sealed class EmailIntentWriter(PrimaryDbContext dbContext) : IEmailIntentWriter
{
    public async ValueTask<EmailIntentHandle> Add(
        EmailIntentAddRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var definition = EmailIntentCatalog.GetDefinition(request.MessageType);
        EmailIntentCatalog.ValidateDedupeFamily(request.MessageType, request.Dedupe.Family);
        var canonical = EmailIntentCanonicalizer.Canonicalize(request, definition);
        var intentId = CreateStableId(request.Dedupe.Value);

        foreach (var trackedEntry in dbContext.ChangeTracker.Entries<EmailIntent>())
        {
            var tracked = trackedEntry.Entity;
            if (tracked.Id != intentId &&
                !string.Equals(tracked.DedupeKey, request.Dedupe.Value, StringComparison.Ordinal))
            {
                continue;
            }

            return ValidateExisting(tracked, request.Dedupe.Value, canonical.RequestHash);
        }

        var existing = await dbContext.EmailIntents.FindAsync(
            new object[] { intentId },
            cancellationToken);
        if (existing is not null)
            return ValidateExisting(existing, request.Dedupe.Value, canonical.RequestHash);

        var now = DateTime.UtcNow;
        var intent = EmailIntent.Create(intentId, request, definition, canonical, now);
        dbContext.EmailIntents.Add(intent);
        return new EmailIntentHandle(intent.Id, intent.DeliveryClass);
    }

    private static EmailIntentHandle ValidateExisting(
        EmailIntent existing,
        string dedupeKey,
        string requestHash)
    {
        if (!string.Equals(existing.DedupeKey, dedupeKey, StringComparison.Ordinal) ||
            !string.Equals(existing.RequestHash, requestHash, StringComparison.Ordinal))
        {
            throw new EmailIntentConflictException(existing.Id);
        }

        return new EmailIntentHandle(existing.Id, existing.DeliveryClass);
    }

    private static Guid CreateStableId(string dedupeKey)
    {
        var namespacedKey = $"swiftpay.email-intent.v1\n{dedupeKey}";
        var digest = SHA256.HashData(Encoding.UTF8.GetBytes(namespacedKey));
        digest[6] = (byte)((digest[6] & 0x0F) | 0x80);
        digest[8] = (byte)((digest[8] & 0x3F) | 0x80);
        return new Guid(digest.AsSpan(0, 16));
    }
}

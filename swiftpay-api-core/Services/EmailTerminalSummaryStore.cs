using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Email;

namespace swiftpay_api_core.Services;

public sealed class EmailTerminalSummaryStore(PrimaryDbContext dbContext) : IEmailTerminalSummaryStore
{
    public async Task<bool> PersistAsync(
        Guid intentId,
        EmailDeliveryTerminalStatus status,
        string? safeErrorCode,
        DateTime occurredAtUtc,
        DateTime? providerAcceptedAtUtc,
        DateTime recordedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var intent = await dbContext.EmailIntents
            .SingleOrDefaultAsync(candidate => candidate.Id == intentId, cancellationToken);
        if (intent is null)
        {
            return false;
        }

        intent.RecordTerminalSummary(
            status,
            safeErrorCode,
            occurredAtUtc,
            providerAcceptedAtUtc,
            recordedAtUtc);
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }
}

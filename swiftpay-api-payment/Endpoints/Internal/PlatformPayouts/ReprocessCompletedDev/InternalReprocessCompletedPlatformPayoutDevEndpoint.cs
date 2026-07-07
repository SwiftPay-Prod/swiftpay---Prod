using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.EndpointsGroups;

namespace swiftpay_api_payment.Endpoints.Internal.PlatformPayouts.ReprocessCompletedDev;

public sealed class InternalReprocessCompletedPlatformPayoutDevEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<InternalReprocessCompletedPlatformPayoutDevRequest, InternalReprocessCompletedPlatformPayoutDevResponse>
{
    public override void Configure()
    {
        Post("items/{platformPayoutItemId:guid}/dev/reprocess-completed");
        Group<InternalPlatformPayoutGroup>();
    }

    public override async Task HandleAsync(InternalReprocessCompletedPlatformPayoutDevRequest req, CancellationToken ct)
    {
        var item = await dbContext.PlatformPayoutItems
            .IgnoreQueryFilters()
            .Include(i => i.Acquirer)
            .OrderBy(i => i.Id)
            .FirstOrDefaultAsync(i => i.Id == req.PlatformPayoutItemId, ct);

        if (item == null)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedPlatformPayoutDevResponse
            {
                Success = false,
                ErrorMessage = "Item do saque de plataforma não encontrado.",
                ErrorCode = "platform_payout_item_not_found"
            }, 404, ct);
            return;
        }

        if (item.Status != PlatformPayoutItemStatus.Processing && item.Status != PlatformPayoutItemStatus.Failed)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedPlatformPayoutDevResponse
            {
                Success = false,
                ErrorMessage = "Apenas itens em processamento ou com falha podem ser reprocessados.",
                ErrorCode = "platform_payout_item_invalid_status"
            }, 400, ct);
            return;
        }

        if (req.TargetStatus == InternalReprocessPlatformPayoutTargetStatus.Completed)
        {
            await ProcessItemCompletedAsync(item);
        }
        else
        {
            await ProcessItemFailedAsync(item);
        }

        var finalStatus = await UpdateParentStatusAsync(item.PlatformPayoutId, ct);

        await Send.OkAsync(new InternalReprocessCompletedPlatformPayoutDevResponse
        {
            Success = true,
            PlatformPayoutItemId = item.Id,
            PlatformPayoutId = item.PlatformPayoutId,
            Status = finalStatus,
            ProcessedItemsCount = 1
        }, ct);
    }

    private async Task ProcessItemCompletedAsync(PlatformPayoutItem item)
    {
        var now = DateTime.UtcNow;

        var claimed = await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id
                && (i.Status == PlatformPayoutItemStatus.Processing || i.Status == PlatformPayoutItemStatus.Failed))
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Completed)
                .SetProperty(i => i.FailureReason, (string?)null)
                .SetProperty(i => i.CompletedAt, now));

        if (claimed == 0) return;

        var acquirerName = item.Acquirer?.Name ?? item.AcquirerId.ToString();

        var ledgerResult = await ledgerService.RecordPlatformWithdrawalCompletedAsync(
            item.PlatformPayoutId,
            item.Id,
            item.AcquirerId,
            item.Amount,
            item.AcquirerFee,
            $"Saque plataforma reprocessado DEV - {acquirerName}");

        if (ledgerResult.Success)
        {
            return;
        }

        var rollbackReason = $"Reprocessamento DEV: falha ao registrar conclusão no ledger: {ledgerResult.ErrorMessage}";
        await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Completed)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                .SetProperty(i => i.CompletedAt, (DateTime?)null)
                .SetProperty(i => i.FailureReason, rollbackReason));
    }

    private async Task ProcessItemFailedAsync(PlatformPayoutItem item)
    {
        const string failureReason = "Reprocessamento DEV: falha simulada.";

        var claimed = await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id
                && (i.Status == PlatformPayoutItemStatus.Processing || i.Status == PlatformPayoutItemStatus.Failed))
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Failed)
                .SetProperty(i => i.CompletedAt, (DateTime?)null)
                .SetProperty(i => i.FailureReason, failureReason));

        if (claimed == 0) return;

        var ledgerResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
            item.PlatformPayoutId,
            item.Id,
            item.Amount,
            $"Saque da plataforma falhou (DEV): {failureReason}");

        if (ledgerResult.Success)
        {
            return;
        }

        var rollbackReason = $"Reprocessamento DEV: falha ao registrar estorno no ledger: {ledgerResult.ErrorMessage}";
        await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Failed)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                .SetProperty(i => i.FailureReason, rollbackReason));
    }

    private async Task<PlatformPayoutStatus?> UpdateParentStatusAsync(Guid platformPayoutId, CancellationToken ct)
    {
        // ExecuteUpdateAsync bypasses tracked entity values, so clear tracker to avoid stale item status reads.
        dbContext.ChangeTracker.Clear();

        var payout = await dbContext.PlatformPayouts
            .IgnoreQueryFilters()
            .Include(p => p.Items)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == platformPayoutId, ct);

        if (payout == null) return null;

        var allItems = payout.Items.ToList();
        var hasProcessing = allItems.Any(i => i.Status == PlatformPayoutItemStatus.Processing);

        if (hasProcessing) return payout.Status;

        var allCompleted = allItems.All(i => i.Status == PlatformPayoutItemStatus.Completed);
        var allFailed = allItems.All(i => i.Status == PlatformPayoutItemStatus.Failed);
        var hasCompleted = allItems.Any(i => i.Status == PlatformPayoutItemStatus.Completed);
        var allCancelled = allItems.All(i => i.Status == PlatformPayoutItemStatus.Cancelled);

        PlatformPayoutStatus newStatus;

        if (allCompleted)
        {
            payout.Status = PlatformPayoutStatus.Completed;
            payout.CompletedAt = DateTime.UtcNow;
            newStatus = PlatformPayoutStatus.Completed;
        }
        else if (allFailed)
        {
            payout.Status = PlatformPayoutStatus.Failed;
            payout.CompletedAt = DateTime.UtcNow;
            newStatus = PlatformPayoutStatus.Failed;
        }
        else if (allCancelled)
        {
            payout.Status = PlatformPayoutStatus.Cancelled;
            payout.CompletedAt = DateTime.UtcNow;
            newStatus = PlatformPayoutStatus.Cancelled;
        }
        else if (hasCompleted)
        {
            payout.Status = PlatformPayoutStatus.PartiallyCompleted;
            payout.CompletedAt = DateTime.UtcNow;
            newStatus = PlatformPayoutStatus.PartiallyCompleted;
        }
        else
        {
            payout.Status = PlatformPayoutStatus.Failed;
            payout.CompletedAt = DateTime.UtcNow;
            newStatus = PlatformPayoutStatus.Failed;
        }

        await dbContext.SaveChangesAsync(ct);
        return newStatus;
    }
}

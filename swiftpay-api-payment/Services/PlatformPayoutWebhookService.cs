using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Messages;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services;

public sealed class PlatformPayoutWebhookService(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    IMessagePublisher messagePublisher,
    ILogger<PlatformPayoutWebhookService> logger
) : IPlatformPayoutWebhookService
{
    public async Task<bool> TryProcessWebhookAsync(
        AcquirerType acquirerType,
        string txId,
        PayoutStatus status,
        string? endToEndId,
        string? acquirerTransactionId,
        string? rejectReason,
        CancellationToken ct = default)
    {
        var item = await FindItemAsync(acquirerType, txId, endToEndId, acquirerTransactionId, ct);

        if (item == null)
        {
            return false;
        }

        var environment = item.PlatformPayout!.Environment;

        if (item.Status != PlatformPayoutItemStatus.Processing)
        {
            logger.LogError(
                "PlatformPayoutItem found via webhook but not in Processing status: ItemId={ItemId}, Status={Status}",
                item.Id, item.Status);
            return true;
        }

        try
        {
            if (status == PayoutStatus.Completed)
            {
                await HandleItemCompletedAsync(item, txId, acquirerTransactionId);
            }
            else if (status == PayoutStatus.Cancelled)
            {
                var reason = rejectReason ?? "Saque cancelado pela adquirente.";
                await HandleItemCancelledAsync(item, reason);
            }
            else
            {
                var reason = rejectReason ?? $"Saque rejeitado/falhou pela adquirente. Status: {status}";
                await HandleItemFailedAsync(item, reason);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing platform payout item webhook: ItemId={ItemId}, AcquirerId={AcquirerId}",
                item.Id, item.AcquirerId);
            await HandleItemFailedAsync(item, $"Erro interno ao processar webhook: {ex.Message}");
        }

        await TryUpdateParentStatusAsync(item.PlatformPayoutId, environment);

        if (item.Status is PlatformPayoutItemStatus.Completed or PlatformPayoutItemStatus.Failed or PlatformPayoutItemStatus.Cancelled)
        {
            await NotifyAdminsAndRefreshBalanceAsync(item, environment, item.FailureReason);
        }

        return true;
    }

    private async Task<PlatformPayoutItem?> FindItemAsync(
        AcquirerType acquirerType,
        string txId,
        string? endToEndId,
        string? acquirerTransactionId,
        CancellationToken ct)
    {
        return await dbContext.PlatformPayoutItems
            .IgnoreQueryFilters()
            .Include(i => i.PlatformPayout)
            .Include(i => i.Acquirer)
            .OrderBy(i => i.Id)
            .FirstOrDefaultAsync(i =>
                i.Status == PlatformPayoutItemStatus.Processing
                && i.Acquirer != null
                && i.Acquirer.IsActive
                && i.Acquirer.Type == acquirerType
                && (i.AcquirerPayoutId == txId
                    || (endToEndId != null && i.PixEndToEndId == endToEndId)
                    || (acquirerTransactionId != null && i.AcquirerTransactionId == acquirerTransactionId)),
                ct);
    }

    private async Task HandleItemCompletedAsync(
        PlatformPayoutItem item,
        string? txId,
        string? acquirerTransactionId)
    {
        var now = DateTime.UtcNow;

        var claimed = await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Completed)
                .SetProperty(i => i.CompletedAt, now)
                .SetProperty(i => i.AcquirerPayoutId, txId ?? item.AcquirerPayoutId)
                .SetProperty(i => i.AcquirerTransactionId, acquirerTransactionId ?? item.AcquirerTransactionId));

        if (claimed == 0)
        {
            return;
        }

        item.Status = PlatformPayoutItemStatus.Completed;
        item.CompletedAt = now;

        var acquirerName = item.Acquirer?.Name ?? item.AcquirerId.ToString();
        var ledgerResult = await ledgerService.RecordPlatformWithdrawalCompletedAsync(
            item.PlatformPayoutId,
            item.Id,
            item.AcquirerId,
            item.Amount,
            item.AcquirerFee,
            $"Saque plataforma - {acquirerName} - TxId: {txId ?? item.AcquirerPayoutId}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record platform withdrawal completed in ledger via webhook: ItemId={ItemId}, Error={Error}",
                item.Id, ledgerResult.ErrorMessage);

            var rollbackReason = $"Falha ao registrar conclusão no ledger via webhook: {ledgerResult.ErrorMessage}";
            await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Completed)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                    .SetProperty(i => i.CompletedAt, (DateTime?)null)
                    .SetProperty(i => i.FailureReason, rollbackReason));

            item.Status = PlatformPayoutItemStatus.Processing;
            item.CompletedAt = null;
            item.FailureReason = rollbackReason;
            return;
        }

        item.FailureReason = null;
    }

    private async Task HandleItemFailedAsync(PlatformPayoutItem item, string errorMessage)
    {
        logger.LogError(
            "Platform payout item failed via webhook: ItemId={ItemId}, AcquirerId={AcquirerId}, Error={Error}",
            item.Id, item.AcquirerId, errorMessage);

        var claimed = await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Failed)
                .SetProperty(i => i.FailureReason, errorMessage));

        if (claimed == 0)
        {
            return;
        }

        item.Status = PlatformPayoutItemStatus.Failed;
        item.FailureReason = errorMessage;

        var ledgerResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
            item.PlatformPayoutId,
            item.Id,
            item.Amount,
            $"Saque da plataforma falhou via webhook: {errorMessage}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record platform withdrawal failure in ledger via webhook: ItemId={ItemId}, Error={Error}",
                item.Id, ledgerResult.ErrorMessage);

            var rollbackReason = $"Falha ao estornar no ledger via webhook: {ledgerResult.ErrorMessage}";
            await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Failed)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                    .SetProperty(i => i.FailureReason, rollbackReason));

            item.Status = PlatformPayoutItemStatus.Processing;
            item.FailureReason = rollbackReason;
        }
    }

    private async Task HandleItemCancelledAsync(PlatformPayoutItem item, string reason)
    {
        var claimed = await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Cancelled)
                .SetProperty(i => i.FailureReason, reason));

        if (claimed == 0)
        {
            return;
        }

        item.Status = PlatformPayoutItemStatus.Cancelled;
        item.FailureReason = reason;

        var ledgerResult = await ledgerService.RecordPlatformWithdrawalFailedAsync(
            item.PlatformPayoutId,
            item.Id,
            item.Amount,
            $"Saque da plataforma cancelado via webhook: {reason}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record platform withdrawal cancellation in ledger via webhook: ItemId={ItemId}, Error={Error}",
                item.Id, ledgerResult.ErrorMessage);

            var rollbackReason = $"Falha ao estornar cancelamento no ledger via webhook: {ledgerResult.ErrorMessage}";
            await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Cancelled)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                    .SetProperty(i => i.FailureReason, rollbackReason));

            item.Status = PlatformPayoutItemStatus.Processing;
            item.FailureReason = rollbackReason;
        }
    }

    private async Task TryUpdateParentStatusAsync(Guid platformPayoutId, ApiEnvironment environment)
    {
        var payout = await dbContext.PlatformPayouts
            .IgnoreQueryFilters()
            .Include(p => p.Items)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == platformPayoutId && p.Environment == environment);

        if (payout == null)
        {
            return;
        }

        var allItems = payout.Items.ToList();
        if (allItems.Any(i => i.Status == PlatformPayoutItemStatus.Processing))
        {
            return;
        }

        var allCompleted = allItems.All(i => i.Status == PlatformPayoutItemStatus.Completed);
        var allFailed = allItems.All(i => i.Status == PlatformPayoutItemStatus.Failed);
        var allCancelled = allItems.All(i => i.Status == PlatformPayoutItemStatus.Cancelled);

        if (allCompleted)
        {
            payout.Status = PlatformPayoutStatus.Completed;
            payout.CompletedAt = DateTime.UtcNow;
        }
        else if (allFailed)
        {
            payout.Status = PlatformPayoutStatus.Failed;
        }
        else if (allCancelled)
        {
            payout.Status = PlatformPayoutStatus.Cancelled;
            payout.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            payout.Status = PlatformPayoutStatus.PartiallyCompleted;
            payout.CompletedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync();
    }

    private async Task NotifyAdminsAndRefreshBalanceAsync(
        PlatformPayoutItem item,
        ApiEnvironment environment,
        string? failureReason)
    {
        if (!messagePublisher.IsEnabled)
        {
            return;
        }

        var adminUserIds = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Status == UserStatus.Active && (u.Role == UserRole.Admin || u.Role == UserRole.God))
            .Select(u => u.Id)
            .ToListAsync();

        if (adminUserIds.Count == 0)
        {
            return;
        }

        var acquirerName = item.Acquirer?.Name ?? item.AcquirerId.ToString();
        var amountText = FormatUtils.FormatCurrency(item.Amount);
        var title = item.Status == PlatformPayoutItemStatus.Completed
            ? "Saque plataforma concluido"
            : "Saque plataforma falhou";
        var message = item.Status == PlatformPayoutItemStatus.Completed
            ? $"Saque plataforma concluido {amountText} ({acquirerName})."
            : $"Saque plataforma falhou {amountText} ({acquirerName}). Motivo: {failureReason ?? "Nao informado"}.";

        await messagePublisher.PublishAsync(
            RabbitMQQueues.CreateBulkUserNotification,
            new CreateBulkUserNotificationMessage(
                UserIds: adminUserIds,
                NotificationType: NotificationType.System,
                StatusType: null,
                Priority: NotificationPriority.Normal,
                Title: title,
                Message: message,
                ActionUrl: "/panel/admin/platform-payouts",
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                SendInApp: true,
                SendPush: true,
                PushData: null));

        await messagePublisher.PublishAsync(
            RabbitMQQueues.ProcessPlatformBalance,
            new ProcessPlatformBalanceMessage
            {
                AcquirerId = item.AcquirerId,
                Environment = environment
            });
    }
}

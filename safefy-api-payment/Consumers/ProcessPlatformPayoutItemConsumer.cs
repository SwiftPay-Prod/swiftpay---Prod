using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using safefy_api_core.Constants;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Models.Messages;
using safefy_api_core.Services;
using safefy_api_core.Utils;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Consumers;

public sealed class ProcessPlatformPayoutItemConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessPlatformPayoutItemConsumer> logger
) : IConsumer<ProcessPlatformPayoutItemMessage>
{
    public async Task Consume(ConsumeContext<ProcessPlatformPayoutItemMessage> context)
    {
        var message = context.Message;

        try
        {
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();
            var withdrawService = scope.ServiceProvider.GetRequiredService<IWithdrawService>();
            var messagePublisher = scope.ServiceProvider.GetService<IMessagePublisher>();
            var apiLogService = scope.ServiceProvider.GetService<IApiLogService>();

            var item = await dbContext.PlatformPayoutItems
                .IgnoreQueryFilters()
                .Include(i => i.PlatformPayout)
                    .ThenInclude(p => p.PayoutAccount)
                .Include(i => i.Acquirer)
                .OrderBy(i => i.Id)
                .FirstOrDefaultAsync(i =>
                    i.Id == message.PlatformPayoutItemId
                    && i.PlatformPayoutId == message.PlatformPayoutId);

            if (item == null)
            {
                logger.LogError(
                    "PlatformPayoutItem not found: ItemId={ItemId}, PayoutId={PayoutId}",
                    message.PlatformPayoutItemId, message.PlatformPayoutId);
                return;
            }

            if (item.Status != PlatformPayoutItemStatus.Processing)
            {
                logger.LogError(
                    "PlatformPayoutItem is not in Processing status: ItemId={ItemId}, Status={Status}",
                    message.PlatformPayoutItemId, item.Status);
                return;
            }

            var payoutAccount = item.PlatformPayout.PayoutAccount;
            if (payoutAccount == null)
            {
                await HandleItemFailedAsync(dbContext, ledgerService, item,
                    "Conta de saque da plataforma não encontrada.");
                await TryUpdateParentStatusAsync(dbContext, item.PlatformPayoutId);
                return;
            }

            try
            {
                var acquirer = item.Acquirer;
                if (acquirer == null)
                {
                    await HandleItemFailedAsync(dbContext, ledgerService, item,
                        "Adquirente não encontrada.");
                    await TryUpdateParentStatusAsync(dbContext, item.PlatformPayoutId);
                    return;
                }

                var amountToSend = FeeCalculator.CalculatePayoutAmountToSend(
                    item.NetAmount,
                    item.AcquirerFee,
                    acquirer.PayoutFeeHandling);

                var withdrawResult = await withdrawService.ProcessPlatformWithdrawAsync(
                    item.Id,
                    item.AcquirerId,
                    amountToSend,
                    payoutAccount.PixKey,
                    payoutAccount.PixKeyType.ToString(),
                    message.Environment);

                if (withdrawResult.Status == WithdrawStatus.Completed)
                {
                    var completionSucceeded = await HandleItemCompletedAsync(dbContext, ledgerService, item, withdrawResult);
                    if (completionSucceeded)
                    {
                        await LogPlatformPayoutItemAsync(
                            apiLogService,
                            ApiLogStatus.Success,
                            message.PlatformPayoutId,
                            item,
                            "Saque de adquirente concluído com sucesso no processamento da plataforma.",
                            200,
                            "platform-payout-item-completed");
                    }
                    else
                    {
                        await LogPlatformPayoutItemAsync(
                            apiLogService,
                            ApiLogStatus.Failed,
                            message.PlatformPayoutId,
                            item,
                            item.FailureReason ?? "Falha ao confirmar conclusão de saque da adquirente no ledger.",
                            500,
                            "platform-payout-item-completed-ledger-failed");
                    }
                }
                else if (withdrawResult.Status == WithdrawStatus.Processing)
                {
                    await HandleItemProcessingAsync(dbContext, item, withdrawResult);
                    await LogPlatformPayoutItemAsync(
                        apiLogService,
                        ApiLogStatus.Warning,
                        message.PlatformPayoutId,
                        item,
                        "Saque de adquirente permanece em processamento. Requer webhook ou reprocessamento manual se ficar pendente.",
                        202,
                        "platform-payout-item-processing");
                }
                else if (withdrawResult.Status == WithdrawStatus.Cancelled)
                {
                    await HandleItemCancelledAsync(dbContext, ledgerService, item,
                        withdrawResult.ErrorMessage ?? "Saque da plataforma cancelado pela adquirente.");
                    await LogPlatformPayoutItemAsync(
                        apiLogService,
                        ApiLogStatus.Failed,
                        message.PlatformPayoutId,
                        item,
                        $"Saque de adquirente cancelado: {withdrawResult.ErrorMessage ?? "Saque da plataforma cancelado pela adquirente."}",
                        409,
                        "platform-payout-item-cancelled");
                }
                else
                {
                    await HandleItemFailedAsync(dbContext, ledgerService, item,
                        withdrawResult.ErrorMessage ?? "Erro ao processar saque da plataforma.");
                    await LogPlatformPayoutItemAsync(
                        apiLogService,
                        ApiLogStatus.Failed,
                        message.PlatformPayoutId,
                        item,
                        $"Falha no saque de adquirente: {withdrawResult.ErrorMessage ?? "Erro ao processar saque da plataforma."}",
                        400,
                        "platform-payout-item-failed");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex,
                    "Error processing platform withdraw: ItemId={ItemId}, AcquirerId={AcquirerId}",
                    item.Id, item.AcquirerId);
                await HandleItemFailedAsync(dbContext, ledgerService, item, $"Erro interno: {ex.Message}");
                await LogPlatformPayoutItemAsync(
                    apiLogService,
                    ApiLogStatus.Failed,
                    message.PlatformPayoutId,
                    item,
                    $"Falha inesperada no processamento do saque: {ex.Message}",
                    500,
                    "platform-payout-item-exception");
            }

            var finalStatus = await TryUpdateParentStatusAsync(dbContext, item.PlatformPayoutId);

            if (item.Status is PlatformPayoutItemStatus.Completed or PlatformPayoutItemStatus.Failed or PlatformPayoutItemStatus.Cancelled)
            {
                await NotifyAdminsAndRefreshBalanceAsync(
                    dbContext,
                    messagePublisher,
                    item,
                    message.Environment,
                    item.FailureReason);
            }

            if (finalStatus == PlatformPayoutStatus.PartiallyCompleted)
            {
                await NotifyPayoutPartiallyCompletedAsync(
                    dbContext,
                    messagePublisher,
                    item.PlatformPayoutId,
                    message.Environment);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error consuming ProcessPlatformPayoutItemMessage: ItemId={ItemId}, PayoutId={PayoutId}",
                message.PlatformPayoutItemId, message.PlatformPayoutId);
            throw;
        }
    }

    private async Task<bool> HandleItemCompletedAsync(
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        PlatformPayoutItem item,
        WithdrawServiceResult result)
    {
        var now = DateTime.UtcNow;

        var claimed = await dbContext.PlatformPayoutItems
            .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Processing)
            .ExecuteUpdateAsync(s => s
                .SetProperty(i => i.Status, PlatformPayoutItemStatus.Completed)
                .SetProperty(i => i.CompletedAt, now)
                .SetProperty(i => i.AcquirerTransactionId, result.AcquirerTransactionId)
                .SetProperty(i => i.AcquirerPayoutId, result.AcquirerTxId));

        if (claimed == 0)
        {
            return false;
        }

        item.Status = PlatformPayoutItemStatus.Completed;
        item.CompletedAt = now;
        item.AcquirerTransactionId = result.AcquirerTransactionId;
        item.AcquirerPayoutId = result.AcquirerTxId;

        var acquirerName = item.Acquirer?.Name ?? item.AcquirerId.ToString();
        var ledgerResult = await ledgerService.RecordPlatformWithdrawalCompletedAsync(
            item.PlatformPayoutId,
            item.Id,
            item.AcquirerId,
            item.Amount,
            item.AcquirerFee,
            $"Saque plataforma - {acquirerName} - TxId: {result.AcquirerTransactionId}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record platform withdrawal completed in ledger: ItemId={ItemId}, Error={Error}",
                item.Id, ledgerResult.ErrorMessage);

            var rollbackReason = $"Falha ao registrar conclusão no ledger: {ledgerResult.ErrorMessage}";
            await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Completed)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                    .SetProperty(i => i.CompletedAt, (DateTime?)null)
                    .SetProperty(i => i.FailureReason, rollbackReason));

            item.Status = PlatformPayoutItemStatus.Processing;
            item.CompletedAt = null;
            item.FailureReason = rollbackReason;
            return false;
        }

        item.FailureReason = null;
        return true;
    }

    private async Task HandleItemProcessingAsync(
        PrimaryDbContext dbContext,
        PlatformPayoutItem item,
        WithdrawServiceResult result)
    {
        item.AcquirerTransactionId = result.AcquirerTransactionId;
        item.AcquirerPayoutId = result.AcquirerTxId;
        item.ProcessedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();
    }

    private async Task HandleItemFailedAsync(
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        PlatformPayoutItem item,
        string errorMessage)
    {
        logger.LogError(
            "Platform payout item failed: ItemId={ItemId}, AcquirerId={AcquirerId}, Error={Error}",
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
            $"Saque da plataforma falhou: {errorMessage}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record platform withdrawal failure in ledger: ItemId={ItemId}, Error={Error}",
                item.Id, ledgerResult.ErrorMessage);

            var rollbackReason = $"Falha ao estornar no ledger: {ledgerResult.ErrorMessage}";
            await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Failed)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                    .SetProperty(i => i.FailureReason, rollbackReason));

            item.Status = PlatformPayoutItemStatus.Processing;
            item.FailureReason = rollbackReason;
        }
    }

    private async Task HandleItemCancelledAsync(
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        PlatformPayoutItem item,
        string reason)
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
            $"Saque da plataforma cancelado: {reason}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record platform withdrawal cancellation in ledger: ItemId={ItemId}, Error={Error}",
                item.Id, ledgerResult.ErrorMessage);

            var rollbackReason = $"Falha ao estornar cancelamento no ledger: {ledgerResult.ErrorMessage}";
            await dbContext.PlatformPayoutItems
                .Where(i => i.Id == item.Id && i.Status == PlatformPayoutItemStatus.Cancelled)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(i => i.Status, PlatformPayoutItemStatus.Processing)
                    .SetProperty(i => i.FailureReason, rollbackReason));

            item.Status = PlatformPayoutItemStatus.Processing;
            item.FailureReason = rollbackReason;
        }
    }

    private async Task<PlatformPayoutStatus?> TryUpdateParentStatusAsync(
        PrimaryDbContext dbContext,
        Guid platformPayoutId)
    {
        var payout = await dbContext.PlatformPayouts
            .IgnoreQueryFilters()
            .Include(p => p.Items)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == platformPayoutId);

        if (payout == null) return null;

        var allItems = payout.Items.ToList();
        var hasProcessing = allItems.Any(i => i.Status == PlatformPayoutItemStatus.Processing);

        if (hasProcessing) return null;

        var allCompleted = allItems.All(i => i.Status == PlatformPayoutItemStatus.Completed);
        var allFailed = allItems.All(i => i.Status == PlatformPayoutItemStatus.Failed);
        var allCancelled = allItems.All(i => i.Status == PlatformPayoutItemStatus.Cancelled);

        PlatformPayoutStatus newStatus;

        if (allCompleted)
        {
            newStatus = PlatformPayoutStatus.Completed;
            payout.CompletedAt = DateTime.UtcNow;
        }
        else if (allFailed)
        {
            newStatus = PlatformPayoutStatus.Failed;
        }
        else if (allCancelled)
        {
            newStatus = PlatformPayoutStatus.Cancelled;
            payout.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            newStatus = PlatformPayoutStatus.PartiallyCompleted;
            payout.CompletedAt = DateTime.UtcNow;
        }

        payout.Status = newStatus;
        await dbContext.SaveChangesAsync();
        return newStatus;
    }

    private static async Task NotifyAdminsAndRefreshBalanceAsync(
        PrimaryDbContext dbContext,
        IMessagePublisher? messagePublisher,
        PlatformPayoutItem item,
        ApiEnvironment environment,
        string? failureReason)
    {
        if (messagePublisher == null || !messagePublisher.IsEnabled)
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

    private async Task NotifyPayoutPartiallyCompletedAsync(
        PrimaryDbContext dbContext,
        IMessagePublisher? messagePublisher,
        Guid platformPayoutId,
        ApiEnvironment environment)
    {
        if (messagePublisher == null || !messagePublisher.IsEnabled)
        {
            return;
        }

        var payout = await dbContext.PlatformPayouts
            .IgnoreQueryFilters()
            .Include(p => p.Items)
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == platformPayoutId);

        if (payout == null) return;

        var adminUserIds = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Status == UserStatus.Active && (u.Role == UserRole.Admin || u.Role == UserRole.God))
            .Select(u => u.Id)
            .ToListAsync();

        if (adminUserIds.Count == 0) return;

        var completedCount = payout.Items.Count(i => i.Status == PlatformPayoutItemStatus.Completed);
        var failedCount = payout.Items.Count(i => i.Status == PlatformPayoutItemStatus.Failed);
        var totalAmount = FormatUtils.FormatCurrency(payout.TotalAmount);

        await messagePublisher.PublishAsync(
            RabbitMQQueues.CreateBulkUserNotification,
            new CreateBulkUserNotificationMessage(
                UserIds: adminUserIds,
                NotificationType: NotificationType.System,
                StatusType: null,
                Priority: NotificationPriority.Normal,
                Title: "Saque plataforma parcialmente concluido",
                Message: $"Saque de {totalAmount} parcialmente processado: {completedCount} adquirente(s) concluida(s), {failedCount} falhou. Valores das falhas devolvidos ao saldo disponivel.",
                ActionUrl: "/panel/admin/platform-payouts",
                ActionLabel: NotificationTemplates.DefaultActionLabel,
                SendInApp: true,
                SendPush: true,
                PushData: null));
    }

    private static async Task LogPlatformPayoutItemAsync(
        IApiLogService? apiLogService,
        ApiLogStatus status,
        Guid platformPayoutId,
        PlatformPayoutItem item,
        string details,
        int statusCode,
        string errorCode)
    {
        if (apiLogService == null)
        {
            return;
        }

        await apiLogService.LogAsync(new ApiLogInput
        {
            Action = ApiLogAction.CreatePlatformPayout,
            Status = status,
            MerchantId = Guid.Empty,
            HttpMethod = "MASS_TRANSIT",
            Endpoint = RabbitMQQueues.ProcessPlatformPayoutItem,
            StatusCode = statusCode,
            Details = details,
            ResourceId = platformPayoutId,
            ResourceType = ApiLogResourceType.Payout,
            ErrorCode = errorCode,
            AcquirerId = item.AcquirerId,
            RequestBody = $"{{\"platformPayoutId\":\"{platformPayoutId}\",\"platformPayoutItemId\":\"{item.Id}\",\"status\":\"{item.Status}\",\"amount\":{item.Amount},\"acquirerFee\":{item.AcquirerFee}}}"
        });
    }
}

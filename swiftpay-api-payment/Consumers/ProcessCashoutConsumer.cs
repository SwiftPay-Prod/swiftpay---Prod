using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Models.Messages;
using swiftpay_api_core.Services;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Constants;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Consumers;

public sealed class ProcessCashoutConsumer(
    IServiceScopeFactory scopeFactory,
    ILogger<ProcessCashoutConsumer> logger
) : IConsumer<ProcessCashoutMessage>
{
    public async Task Consume(ConsumeContext<ProcessCashoutMessage> context)
    {
        var message = context.Message;

        try
        {
            // Define o environment ANTES de criar o scope para que o DbContext use o QueryFilter correto
            using var environmentScope = HybridEnvironmentProvider.SetEnvironment(message.Environment);
            using var scope = scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<PrimaryDbContext>();
            var ledgerService = scope.ServiceProvider.GetRequiredService<ILedgerService>();
            var withdrawService = scope.ServiceProvider.GetRequiredService<IWithdrawService>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
            var emailIntentWriter = scope.ServiceProvider.GetRequiredService<IEmailIntentWriter>();
            var messagePublisher = scope.ServiceProvider.GetRequiredService<IMessagePublisher>();
            var referralCommissionCompilationService = scope.ServiceProvider.GetRequiredService<IReferralCommissionCompilationService>();

            var payout = await dbContext.Payouts
                .Include(p => p.PayoutAccount)
                .Include(p => p.MerchantAcquirer)
                    .ThenInclude(ma => ma!.Acquirer)
                .Include(p => p.Merchant)
                    .ThenInclude(m => m.User)
                .OrderBy(p => p.Id)
                .FirstOrDefaultAsync(p => p.Id == message.PayoutId);

            if (payout == null)
            {
                logger.LogError("Payout not found: PayoutId={PayoutId}", message.PayoutId);
                return;
            }

            if (payout.Environment == ApiEnvironment.Sandbox)
            {
                return;
            }

            if (payout.Status != PayoutStatus.Processing)
            {
                logger.LogError(
                    "Payout is not in Processing status: PayoutId={PayoutId}, Status={Status}",
                    message.PayoutId, payout.Status);
                return;
            }

            var payoutAccount = payout.PayoutAccount;
            var resolvedPixKey = payoutAccount?.PixKey ?? payout.InlinePixKey;
            var resolvedPixKeyType = payoutAccount?.PixKeyType.ToString() ?? payout.InlinePixKeyType;

            if (string.IsNullOrEmpty(resolvedPixKey) || string.IsNullOrEmpty(resolvedPixKeyType))
            {
                await HandleFailedAsync(dbContext, ledgerService, notificationService, messagePublisher, payout,
                    "Conta de saque ou chave PIX não encontrada.");
                return;
            }

            var merchantAcquirer = payout.MerchantAcquirer;
            if (merchantAcquirer == null)
            {
                await HandleFailedAsync(dbContext, ledgerService, notificationService, messagePublisher, payout,
                    "Processadora não encontrada.");
                return;
            }

            var acquirer = merchantAcquirer.Acquirer;
            if (acquirer == null)
            {
                await HandleFailedAsync(dbContext, ledgerService, notificationService, messagePublisher, payout,
                    "Adquirente não encontrada.");
                return;
            }

            var amountToSend = FeeCalculator.CalculatePayoutAmountToSend(
                payout.NetAmount,
                payout.AcquirerFee,
                acquirer.PayoutFeeHandling);

            WithdrawServiceResult withdrawResult;
            try
            {
                withdrawResult = await withdrawService.ProcessWithdrawAsync(
                    payout.MerchantId,
                    payout.Id,
                    payout.MerchantAcquirerId,
                    merchantAcquirer.AcquirerId,
                    amountToSend,
                    resolvedPixKey,
                    resolvedPixKeyType,
                    payout.Environment);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error calling acquirer withdraw: PayoutId={PayoutId}", payout.Id);
                await HandleFailedAsync(
                    dbContext, ledgerService, notificationService, messagePublisher, payout,
                    $"Erro interno: {ex.Message}");
                return;
            }

            if (withdrawResult.Status != WithdrawStatus.Processing)
            {
                var terminalLockAcquired = await TryAcquireTerminalLockAsync(dbContext, payout.Id);
                if (!terminalLockAcquired)
                {
                    return;
                }
            }

            switch (withdrawResult.Status)
            {
                case WithdrawStatus.Completed:
                    await HandleCompletedAsync(
                        dbContext, ledgerService, notificationService, emailIntentWriter, messagePublisher,
                        payout, resolvedPixKey, resolvedPixKeyType, merchantAcquirer, withdrawResult,
                        referralCommissionCompilationService, context.CancellationToken);
                    break;

                case WithdrawStatus.Processing:
                    await HandleProcessingAsync(
                        dbContext, notificationService, payout, withdrawResult);
                    break;

                case WithdrawStatus.Cancelled:
                    await HandleCancelledAsync(
                        dbContext, ledgerService, notificationService, messagePublisher, payout,
                        withdrawResult.ErrorMessage ?? "Saque cancelado pela adquirente.");
                    break;

                default:
                    await HandleFailedAsync(
                        dbContext, ledgerService, notificationService, messagePublisher, payout,
                        withdrawResult.ErrorMessage ?? "Erro ao processar saque.");
                    break;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing ProcessCashoutMessage: PayoutId={PayoutId}",
                message.PayoutId);
            throw;
        }
    }

    private async Task HandleCompletedAsync(
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IEmailIntentWriter emailIntentWriter,
        IMessagePublisher messagePublisher,
        Payout payout,
        string pixKey,
        string pixKeyType,
        MerchantAcquirer merchantAcquirer,
        WithdrawServiceResult result,
        IReferralCommissionCompilationService referralCommissionCompilationService,
        CancellationToken ct)
    {

        var ledgerResult = await ledgerService.RecordWithdrawalCompletedAsync(
            payout.MerchantId,
            payout.Id,
            merchantAcquirer.Id,
            merchantAcquirer.AcquirerId,
            payout.Amount,
            payout.PlatformFee,
            payout.AcquirerFee,
            $"Saque concluído - TxId: {result.AcquirerTransactionId}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record payout completion in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to record payout completion for {payout.Id}: {ledgerResult.ErrorMessage}");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(ct);
        payout.Status = PayoutStatus.Completed;
        payout.CompletedAt = DateTime.UtcNow;
        payout.AcquirerTransactionId = result.AcquirerTransactionId ?? result.AcquirerTxId;
        payout.AcquirerStatus = "DONE";

        if (payout.Merchant?.User?.Email != null)
        {
            await emailIntentWriter.Add(new EmailIntentAddRequest
            {
                Dedupe = EmailIntentDedupeKey.BusinessTransition(
                    EmailMessageType.PayoutCompleted,
                    payout.Id,
                    payout.Id),
                MessageType = EmailMessageType.PayoutCompleted,
                RecipientAddress = payout.Merchant.User.Email,
                Owner = new(EmailIntentOwnerType.Merchant, payout.MerchantId),
                CorrelationId = $"payout:{payout.Id:N}:completed",
                Inputs = new Dictionary<string, string>
                {
                    ["NAME"] = payout.Merchant.User.Name ?? "Merchant",
                    ["AMOUNT"] = FormatUtils.FormatCurrencyNumber(payout.NetAmount),
                    ["PIX_KEY"] = MaskUtils.MaskPixKey(pixKey, pixKeyType),
                    ["DATE"] = payout.CompletedAt.Value.ToString("dd/MM/yyyy HH:mm"),
                    ["TRANSACTION_ID"] = result.AcquirerTransactionId ?? "N/A"
                }
            }, ct);
        }

        await referralCommissionCompilationService.RegisterPayoutCompletedMovementAsync(
            payout.Id,
            payout.MerchantId,
            payout.PlatformFee - payout.AcquirerFee,
            payout.Environment,
            payout.CompletedAt.Value,
            ct);

        await dbContext.SaveChangesAsync(ct);
        await transaction.CommitAsync(ct);

        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Completed.Title,
            NotificationTemplates.Payout.Completed.MessageWithAccount(
                payout.NetAmount,
                MaskUtils.MaskPixKey(pixKey, pixKeyType)),
            NotificationStatusType.PayoutCompleted,
            payout.Environment,
            actionUrl: $"/payouts/{payout.Id}");


        if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.SendCashoutWebhook,
                payout.ToWebhookMessage(WebhookEvents.Cashout.Completed));
        }
    }

    private async Task HandleProcessingAsync(
        PrimaryDbContext dbContext,
        INotificationService notificationService,
        Payout payout,
        WithdrawServiceResult result)
    {
        payout.AcquirerTransactionId = result.AcquirerTransactionId ?? result.AcquirerTxId;
        payout.AcquirerStatus = "GENERATED";

        await dbContext.SaveChangesAsync();

        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Processing.Title,
            NotificationTemplates.Payout.Processing.Message(payout.NetAmount),
            NotificationStatusType.PayoutProcessing,
            payout.Environment,
            actionUrl: $"/payouts/{payout.Id}");
    }

    private async Task HandleFailedAsync(
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IMessagePublisher messagePublisher,
        Payout payout,
        string errorMessage)
    {
        if (payout.Status != PayoutStatus.Processing)
        {
            logger.LogWarning(
                "HandleFailedAsync skipped: payout already in status {Status}: PayoutId={PayoutId}",
                payout.Status, payout.Id);
            return;
        }

        logger.LogError(
            "Cashout failed: PayoutId={PayoutId}, Error={Error}",
            payout.Id, errorMessage);

        payout.Status = PayoutStatus.Failed;
        payout.FailureReason = errorMessage;
        payout.AcquirerStatus = "FAILED";

        var ledgerResult = await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            $"Saque falhou: {errorMessage}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record payout failure in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to restore balance for payout {payout.Id}: {ledgerResult.ErrorMessage}");
        }

        await dbContext.SaveChangesAsync();

        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Failed.Title,
            NotificationTemplates.Payout.Failed.Message(payout.NetAmount),
            NotificationStatusType.PayoutFailed,
            payout.Environment,
            actionUrl: $"/payouts/{payout.Id}");

        if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.SendCashoutWebhook,
                payout.ToWebhookMessage(WebhookEvents.Cashout.Failed));
        }
    }

    private async Task HandleCancelledAsync(
        PrimaryDbContext dbContext,
        ILedgerService ledgerService,
        INotificationService notificationService,
        IMessagePublisher messagePublisher,
        Payout payout,
        string reason)
    {
        payout.Status = PayoutStatus.Cancelled;
        payout.FailureReason = reason;
        payout.AcquirerStatus = "CANCELED";

        var ledgerResult = await ledgerService.RecordWithdrawalFailedAsync(
            payout.MerchantId,
            payout.Id,
            payout.MerchantAcquirerId,
            payout.Amount,
            payout.PlatformFee,
            $"Saque cancelado: {reason}");

        if (!ledgerResult.Success)
        {
            logger.LogError(
                "Failed to record payout cancellation in ledger: PayoutId={PayoutId}, Error={Error}",
                payout.Id, ledgerResult.ErrorMessage);
            throw new InvalidOperationException(
                $"Failed to restore balance for cancelled payout {payout.Id}: {ledgerResult.ErrorMessage}");
        }

        await dbContext.SaveChangesAsync();

        await notificationService.CreatePayoutNotificationAsync(
            payout.MerchantId,
            NotificationTemplates.Payout.Cancelled.Title,
            NotificationTemplates.Payout.Cancelled.Message(payout.NetAmount),
            NotificationStatusType.PayoutCancelled,
            payout.Environment,
            actionUrl: $"/payouts/{payout.Id}");

        if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
        {
            await messagePublisher.PublishAsync(
                RabbitMQQueues.SendCashoutWebhook,
                payout.ToWebhookMessage(WebhookEvents.Cashout.Cancelled));
        }
    }

    private static async Task<bool> TryAcquireTerminalLockAsync(PrimaryDbContext dbContext, Guid payoutId)
    {
        var rowsAffected = await dbContext.Payouts
            .Where(p => p.Id == payoutId && p.Status == PayoutStatus.Processing)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.Status, PayoutStatus.Confirming)
                .SetProperty(p => p.UpdatedAt, DateTime.UtcNow));

        return rowsAffected > 0;
    }
}

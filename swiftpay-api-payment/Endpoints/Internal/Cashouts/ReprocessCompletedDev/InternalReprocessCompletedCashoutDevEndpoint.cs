using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Constants;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Email;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;

namespace swiftpay_api_payment.Endpoints.Internal.Cashouts.ReprocessCompletedDev;

public sealed class InternalReprocessCompletedCashoutDevEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService,
    INotificationService notificationService,
    IEmailService emailService,
    IMessagePublisher messagePublisher,
    IReferralCommissionCompilationService referralCommissionCompilationService
) : Endpoint<InternalReprocessCompletedCashoutDevRequest, InternalReprocessCompletedCashoutDevResponse>
{
    private static readonly PayoutStatus[] TerminalStatuses =
        [PayoutStatus.Failed, PayoutStatus.Rejected, PayoutStatus.Cancelled];

    private static readonly PayoutStatus[] BlockedStatuses =
        [PayoutStatus.Pending, PayoutStatus.Processing, PayoutStatus.Confirming];

    public override void Configure()
    {
        Post("{cashoutId:guid}/dev/reprocess-completed");
        Group<InternalCashoutGroup>();
    }

    public override async Task HandleAsync(InternalReprocessCompletedCashoutDevRequest req, CancellationToken ct)
    {
        var payout = await dbContext.Payouts
            .Include(p => p.PayoutAccount)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma!.Acquirer)
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(p => p.Id == req.CashoutId && p.MerchantId == req.MerchantId, ct);

        var targetStatus = req.TargetStatus switch
        {
            InternalReprocessCashoutStatus.Failed => PayoutStatus.Failed,
            InternalReprocessCashoutStatus.Rejected => PayoutStatus.Rejected,
            InternalReprocessCashoutStatus.Cancelled => PayoutStatus.Cancelled,
            _ => PayoutStatus.Completed
        };

        if (payout == null)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
            {
                Success = false,
                ErrorMessage = "Saque não encontrado.",
                ErrorCode = "cashout_not_found"
            }, 404, ct);
            return;
        }

        if (payout.Status == targetStatus)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
            {
                Success = false,
                CashoutId = payout.Id,
                Status = payout.Status,
                CompletedAt = payout.CompletedAt,
                ErrorMessage = $"O saque já está em {targetStatus}.",
                ErrorCode = "already_in_target_status"
            }, 400, ct);
            return;
        }

        var allowedStatuses = new[]
        {
            PayoutStatus.Pending,
            PayoutStatus.Processing,
            PayoutStatus.Confirming,
            PayoutStatus.Failed,
            PayoutStatus.Rejected,
            PayoutStatus.Cancelled
        };

        if (!allowedStatuses.Contains(payout.Status))
        {
            await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
            {
                Success = false,
                CashoutId = payout.Id,
                Status = payout.Status,
                ErrorMessage = $"Status atual não pode ser reprocessado: {payout.Status}.",
                ErrorCode = "invalid_status"
            }, 400, ct);
            return;
        }

        if (payout.MerchantAcquirer?.Acquirer == null)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
            {
                Success = false,
                CashoutId = payout.Id,
                ErrorMessage = "Adquirente do saque não encontrado.",
                ErrorCode = "acquirer_not_found"
            }, 400, ct);
            return;
        }

        var isCurrentTerminal = TerminalStatuses.Contains(payout.Status);
        var isCurrentBlocked = BlockedStatuses.Contains(payout.Status);
        var isTargetTerminal = TerminalStatuses.Contains(targetStatus);
        var isTargetCompleted = targetStatus == PayoutStatus.Completed;

        if (isCurrentTerminal && isTargetTerminal)
        {
            // Terminal → Terminal: balance already restored, just update status
            payout.Status = targetStatus;
            payout.FailureReason = targetStatus is PayoutStatus.Failed or PayoutStatus.Rejected
                ? "Reprocessamento DEV: status alterado."
                : null;
            payout.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }
        else if (isCurrentTerminal && isTargetCompleted)
        {
            // Terminal → Completed: re-block balance then settle
            var rearmResult = await ledgerService.RecordWithdrawalRequestedAsync(
                payout.MerchantId,
                payout.Id,
                payout.MerchantAcquirerId,
                payout.Amount,
                payout.PlatformFee,
                "Reprocessamento DEV: re-bloqueio de saldo para conclusão");

            if (!rearmResult.Success)
            {
                await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
                {
                    Success = false,
                    CashoutId = payout.Id,
                    ErrorMessage = rearmResult.ErrorMessage ?? "Falha ao bloquear saldo no ledger.",
                    ErrorCode = "ledger_rearm_failed"
                }, 400, ct);
                return;
            }

            var settleResult = await ledgerService.RecordWithdrawalCompletedAsync(
                payout.MerchantId,
                payout.Id,
                payout.MerchantAcquirerId,
                payout.MerchantAcquirer.AcquirerId,
                payout.Amount,
                payout.PlatformFee,
                payout.AcquirerFee,
                "Reprocessamento DEV: conclusão de saque");

            if (!settleResult.Success)
            {
                // Rollback the rearm
                await ledgerService.RecordWithdrawalFailedAsync(
                    payout.MerchantId,
                    payout.Id,
                    payout.MerchantAcquirerId,
                    payout.Amount,
                    payout.PlatformFee,
                    "Reprocessamento DEV: rollback de conclusão falha");

                await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
                {
                    Success = false,
                    CashoutId = payout.Id,
                    ErrorMessage = settleResult.ErrorMessage ?? "Falha ao concluir saque no ledger.",
                    ErrorCode = "ledger_settle_failed"
                }, 400, ct);
                return;
            }

            payout.Status = PayoutStatus.Completed;
            payout.CompletedAt = DateTime.UtcNow;
            payout.FailureReason = null;
            payout.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }
        else if (isCurrentBlocked && isTargetTerminal)
        {
            // Blocked → Terminal: restore balance from blocked to available
            var failResult = await ledgerService.RecordWithdrawalFailedAsync(
                payout.MerchantId,
                payout.Id,
                payout.MerchantAcquirerId,
                payout.Amount,
                payout.PlatformFee,
                "Reprocessamento DEV: restauração de saldo");

            if (!failResult.Success)
            {
                await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
                {
                    Success = false,
                    CashoutId = payout.Id,
                    ErrorMessage = failResult.ErrorMessage ?? "Falha ao restaurar saldo no ledger.",
                    ErrorCode = "ledger_restore_failed"
                }, 400, ct);
                return;
            }

            payout.Status = targetStatus;
            payout.FailureReason = targetStatus is PayoutStatus.Failed or PayoutStatus.Rejected
                ? "Reprocessamento DEV: status alterado."
                : null;
            payout.ProcessedAt ??= DateTime.UtcNow;
            payout.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }
        else if (isCurrentBlocked && isTargetCompleted)
        {
            // Blocked → Completed: settle directly from blocked
            var settleResult = await ledgerService.RecordWithdrawalCompletedAsync(
                payout.MerchantId,
                payout.Id,
                payout.MerchantAcquirerId,
                payout.MerchantAcquirer.AcquirerId,
                payout.Amount,
                payout.PlatformFee,
                payout.AcquirerFee,
                "Reprocessamento DEV: conclusão de saque");

            if (!settleResult.Success)
            {
                await Send.ResponseAsync(new InternalReprocessCompletedCashoutDevResponse
                {
                    Success = false,
                    CashoutId = payout.Id,
                    ErrorMessage = settleResult.ErrorMessage ?? "Falha ao concluir saque no ledger.",
                    ErrorCode = "ledger_settle_failed"
                }, 400, ct);
                return;
            }

            payout.Status = PayoutStatus.Completed;
            payout.CompletedAt = DateTime.UtcNow;
            payout.FailureReason = null;
            payout.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }

        // Send notifications based on target status
        await SendReprocessNotificationsAsync(payout, targetStatus, ct);

        await Send.OkAsync(new InternalReprocessCompletedCashoutDevResponse
        {
            Success = true,
            CashoutId = payout.Id,
            Status = payout.Status,
            CompletedAt = payout.CompletedAt,
            EndToEndId = payout.PixEndToEndId,
            AcquirerTransactionId = payout.AcquirerTransactionId
        }, ct);
    }

    private async Task SendReprocessNotificationsAsync(Payout payout, PayoutStatus targetStatus, CancellationToken ct)
    {
        var payoutAccount = payout.PayoutAccount;
        var resolvedPixKey = payoutAccount?.PixKey ?? payout.InlinePixKey;
        var resolvedPixKeyType = payoutAccount?.PixKeyType.ToString() ?? payout.InlinePixKeyType;

        if (targetStatus == PayoutStatus.Completed)
        {
            var maskedKey = !string.IsNullOrEmpty(resolvedPixKey) && !string.IsNullOrEmpty(resolvedPixKeyType)
                ? MaskUtils.MaskPixKey(resolvedPixKey, resolvedPixKeyType)
                : "N/A";

            await notificationService.CreatePayoutNotificationAsync(
                payout.MerchantId,
                NotificationTemplates.Payout.Completed.Title,
                NotificationTemplates.Payout.Completed.MessageWithAccount(payout.NetAmount, maskedKey),
                NotificationStatusType.PayoutCompleted,
                payout.Environment,
                actionUrl: $"/payouts/{payout.Id}");

            if (payout.Merchant?.User?.Email != null)
            {
                _ = emailService.SendAsync(
                    payout.Merchant.User.Email,
                    "✅ Saque Concluído - Safefy",
                    EmailTemplate.PayoutCompleted,
                    new Dictionary<string, string>
                    {
                        { "NAME", payout.Merchant.User.Name ?? "Merchant" },
                        { "AMOUNT", FormatUtils.FormatCurrencyNumber(payout.NetAmount) },
                        { "PIX_KEY", maskedKey },
                        { "DATE", DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm") },
                        { "TRANSACTION_ID", payout.AcquirerTransactionId ?? "N/A" }
                    });
            }

            await referralCommissionCompilationService.RegisterPayoutCompletedMovementAsync(
                payout.Id,
                payout.MerchantId,
                payout.PlatformFee - payout.AcquirerFee,
                payout.Environment,
                payout.CompletedAt ?? DateTime.UtcNow);

            if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.SendCashoutWebhook,
                    payout.ToWebhookMessage(WebhookEvents.Cashout.Completed));
            }
        }
        else if (targetStatus == PayoutStatus.Failed)
        {
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
        else if (targetStatus == PayoutStatus.Rejected)
        {
            await notificationService.CreatePayoutNotificationAsync(
                payout.MerchantId,
                NotificationTemplates.Payout.Rejected.Title,
                NotificationTemplates.Payout.Rejected.Message(payout.NetAmount),
                NotificationStatusType.PayoutRejected,
                payout.Environment,
                actionUrl: $"/payouts/{payout.Id}");

            if (!string.IsNullOrWhiteSpace(payout.CallbackUrl))
            {
                await messagePublisher.PublishAsync(
                    RabbitMQQueues.SendCashoutWebhook,
                    payout.ToWebhookMessage(WebhookEvents.Cashout.Rejected));
            }
        }
        else if (targetStatus == PayoutStatus.Cancelled)
        {
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
    }
}

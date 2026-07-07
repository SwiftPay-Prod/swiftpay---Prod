using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.HunterPay.Models.Webhook;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.HunterPay.Webhook;

public sealed class HunterPayWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<HunterPayWebhookEndpoint> logger
) : Endpoint<HunterPayWebhookRequest, HunterPayWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<HunterPayGroup>();
    }

    public override async Task HandleAsync(HunterPayWebhookRequest req, CancellationToken ct)
    {
        try
        {
            if (IsWithdrawalWebhook(req))
            {
                await ProcessWithdrawalAsync(req, ct);
                await SendProcessedAsync(ct);
                return;
            }

            if (IsTransactionWebhook(req))
            {
                await ProcessTransactionAsync(req, ct);
                await SendProcessedAsync(ct);
                return;
            }

            await SendProcessedAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing HunterPay webhook");
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.HunterPay,
                "Erro interno ao processar webhook.",
                "internal_error",
                req,
                null,
                ResolveTransactionId(req),
                ResolvePayoutId(req),
                ct);

            await Send.ResponseAsync(new HunterPayWebhookResponse
            {
                Data = new HunterPayWebhookData { Processed = false },
                Error = new("Erro interno ao processar webhook.")
            }, 200, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(HunterPayWebhookRequest req, CancellationToken ct)
    {
        var data = req.Data;
        var transactionId = ResolveTransactionId(req);
        if (data == null || string.IsNullOrWhiteSpace(transactionId))
        {
            return;
        }

        var status = HunterPayStatusConverter.ToPaymentStatus(data.Status);
        var result = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.HunterPay,
            AcquirerPaymentId = transactionId,
            TxId = transactionId,
            Status = status,
            EndToEndId = data.Pix?.EndToEndId,
            PayerName = data.Customer?.Name,
            PayerDocument = data.Customer?.ResolvedDocumentNumber,
            ErrorMessage = status switch
            {
                PaymentStatus.Failed => "Pagamento recusado pela HunterPay.",
                PaymentStatus.Cancelled => "Pagamento cancelado na HunterPay.",
                PaymentStatus.Refunded => "Pagamento estornado na HunterPay.",
                PaymentStatus.Disputed => "Pagamento em chargeback na HunterPay.",
                _ => null
            },
            RefundedAmount = data.RefundedAmount
        }, ct);

        if (!result.Success)
        {
            logger.LogError("Failed to process HunterPay transaction webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.HunterPay,
                result.ErrorMessage,
                result.PaymentNotFound ? "transaction_not_found" : null,
                req,
                null,
                transactionId,
                transactionId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.HunterPay,
            ApiLogStatus.Success,
            $"Webhook HunterPay transaction processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            transactionId,
            transactionId,
            ct: ct);
    }

    private async Task ProcessWithdrawalAsync(HunterPayWebhookRequest req, CancellationToken ct)
    {
        var withdrawal = req.Withdrawal;
        var payoutId = ResolvePayoutId(req);
        if (withdrawal == null || string.IsNullOrWhiteSpace(payoutId))
        {
            return;
        }

        var status = HunterPayStatusConverter.ToPayoutStatus(withdrawal.Status);
        var rejectReason = status is PayoutStatus.Failed or PayoutStatus.Rejected
            ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque")
            : null;

        var result = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
        {
            AcquirerType = AcquirerType.HunterPay,
            TxId = payoutId,
            Status = status,
            EndToEndId = withdrawal.Pix?.EndToEndId,
            AcquirerTransactionId = payoutId,
            PixKey = withdrawal.Pix?.KeyValue,
            PixKeyType = withdrawal.Pix?.KeyType,
            RejectReason = rejectReason,
            CompletedAt = status == PayoutStatus.Completed ? (withdrawal.PaidAt ?? DateTime.UtcNow) : null
        }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.HunterPay,
                payoutId,
                status,
                withdrawal.Pix?.EndToEndId,
                payoutId,
                rejectReason,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process HunterPay withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.HunterPay,
                result.ErrorMessage,
                null,
                req,
                null,
                payoutId,
                payoutId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.HunterPay,
            ApiLogStatus.Success,
            $"Webhook HunterPay withdrawal processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
                payoutId,
                payoutId,
            ct: ct);
    }

    private static bool IsTransactionWebhook(HunterPayWebhookRequest req)
    {
        if (req.Type == HunterPayWebhookType.Transaction)
            return true;

        if (req.Event is HunterPayWebhookEventType.TransactionCreated
            or HunterPayWebhookEventType.TransactionUpdated
            or HunterPayWebhookEventType.TransactionPaid
            or HunterPayWebhookEventType.TransactionRefunded
            or HunterPayWebhookEventType.TransactionFailed
            or HunterPayWebhookEventType.TransactionCancelled)
            return true;

        return req.Data != null && !string.IsNullOrWhiteSpace(ResolveTransactionId(req));
    }

    private static bool IsWithdrawalWebhook(HunterPayWebhookRequest req)
    {
        if (!string.IsNullOrWhiteSpace(ResolvePayoutId(req)))
            return true;

        if (req.Type == HunterPayWebhookType.Withdrawal)
            return true;

        return req.Event is HunterPayWebhookEventType.WithdrawalCreated
            or HunterPayWebhookEventType.WithdrawalUpdated
            or HunterPayWebhookEventType.WithdrawalCompleted
            or HunterPayWebhookEventType.WithdrawalFailed
            or HunterPayWebhookEventType.WithdrawalRejected
            or HunterPayWebhookEventType.WithdrawalCancelled;
    }

    private static string? ResolveTransactionId(HunterPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.Data?.Id,
            req.ObjectId,
            req.Id);
    }

    private static string? ResolvePayoutId(HunterPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.Withdrawal?.Id,
            req.ObjectId,
            req.Id);
    }

    private Task SendProcessedAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new HunterPayWebhookResponse
        {
            Data = new HunterPayWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }
}

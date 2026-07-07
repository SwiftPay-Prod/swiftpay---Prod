using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.HeartPay.Models.Webhook;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.HeartPay.Webhook;

public sealed class HeartPayWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<HeartPayWebhookEndpoint> logger
) : Endpoint<HeartPayWebhookRequest, HeartPayWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<HeartPayGroup>();
    }

    public override async Task HandleAsync(HeartPayWebhookRequest req, CancellationToken ct)
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
            logger.LogError(ex, "Error processing HeartPay webhook");
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.HeartPay,
                "Erro interno ao processar webhook.",
                "internal_error",
                req,
                null,
                ResolveTransactionId(req),
                ResolvePayoutId(req),
                ct);

            await Send.ResponseAsync(new HeartPayWebhookResponse
            {
                Data = new HeartPayWebhookData { Processed = false },
                Error = new("Erro interno ao processar webhook.")
            }, 200, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(HeartPayWebhookRequest req, CancellationToken ct)
    {
        var transactionId = ResolveTransactionId(req);
        if (string.IsNullOrWhiteSpace(transactionId))
            return;

        var status = HeartPayStatusConverter.ToPaymentStatus(ResolveStatus(req));

        var result = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.HeartPay,
            AcquirerPaymentId = transactionId,
            TxId = ResolveTxId(req) ?? transactionId,
            Status = status,
            EndToEndId = ResolveEndToEndId(req),
            ErrorMessage = status switch
            {
                PaymentStatus.Failed => ResolveErrorMessage(req) ?? "Pagamento recusado pela HeartPay.",
                PaymentStatus.Cancelled => ResolveErrorMessage(req) ?? "Pagamento cancelado na HeartPay.",
                _ => null
            }
        }, ct);

        if (!result.Success)
        {
            logger.LogError("Failed to process HeartPay transaction webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.HeartPay,
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
            AcquirerType.HeartPay,
            ApiLogStatus.Success,
            $"Webhook HeartPay transaction processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            transactionId,
            transactionId,
            ct: ct);
    }

    private async Task ProcessWithdrawalAsync(HeartPayWebhookRequest req, CancellationToken ct)
    {
        var payoutId = ResolvePayoutId(req);
        if (string.IsNullOrWhiteSpace(payoutId))
            return;

        var status = HeartPayStatusConverter.ToPayoutStatus(ResolveStatus(req));
        var rejectReason = status is PayoutStatus.Failed or PayoutStatus.Rejected
            ? (ResolveErrorMessage(req) ?? "Falha no processamento do saque")
            : null;

        var result = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
        {
            AcquirerType = AcquirerType.HeartPay,
            TxId = payoutId,
            Status = status,
            EndToEndId = ResolveEndToEndId(req),
            AcquirerTransactionId = payoutId,
            PixKey = ResolvePixKey(req),
            PixKeyType = ResolvePixKeyType(req),
            RejectReason = rejectReason,
            CompletedAt = status == PayoutStatus.Completed ? (ResolvePaidAt(req) ?? DateTime.UtcNow) : null
        }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.HeartPay,
                payoutId,
                status,
                ResolveEndToEndId(req),
                payoutId,
                rejectReason,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process HeartPay withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.HeartPay,
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
            AcquirerType.HeartPay,
            ApiLogStatus.Success,
            $"Webhook HeartPay withdrawal processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
            payoutId,
            payoutId,
            ct: ct);
    }

    private static bool IsTransactionWebhook(HeartPayWebhookRequest req)
    {
        var eventType = ResolveEvent(req);
        if (eventType.HasValue && eventType.Value != HeartPayWebhookEventType.Unknown)
            return IsTransactionEvent(eventType.Value);

        var webhookType = ResolveType(req);
        if (webhookType == HeartPayWebhookType.Charge)
            return true;

        return !string.IsNullOrWhiteSpace(ResolveTransactionId(req));
    }

    private static bool IsWithdrawalWebhook(HeartPayWebhookRequest req)
    {
        var eventType = ResolveEvent(req);
        if (eventType.HasValue && eventType.Value != HeartPayWebhookEventType.Unknown)
            return IsWithdrawalEvent(eventType.Value);

        var webhookType = ResolveType(req);
        if (webhookType == HeartPayWebhookType.Payout)
            return true;

        return !string.IsNullOrWhiteSpace(ResolvePayoutId(req));
    }

    private Task SendProcessedAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new HeartPayWebhookResponse
        {
            Data = new HeartPayWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }

    private static HeartPayWebhookEventType? ResolveEvent(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstKnown(req, HeartPayWebhookEventType.Unknown, x => x.Event)
            ?? WebhookFieldResolver.FirstKnownFromChain(req.Data, x => x.Data, HeartPayWebhookEventType.Unknown, x => x.Event)
            ?? req.Event;
    }

    private static HeartPayWebhookStatus? ResolveStatus(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstKnown(req, HeartPayWebhookStatus.Unknown, x => x.Status)
            ?? WebhookFieldResolver.FirstKnownFromChain(req.Data, x => x.Data, HeartPayWebhookStatus.Unknown, x => x.Status)
            ?? req.Status;
    }

    private static HeartPayWebhookType? ResolveType(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstKnown(req, HeartPayWebhookType.Unknown, x => x.Type)
            ?? WebhookFieldResolver.FirstKnownFromChain(req.Data, x => x.Data, HeartPayWebhookType.Unknown, x => x.Type)
            ?? req.Type;
    }

    private static bool IsTransactionEvent(HeartPayWebhookEventType eventType)
    {
        return eventType is HeartPayWebhookEventType.ChargeCreated
            or HeartPayWebhookEventType.ChargeUpdated
            or HeartPayWebhookEventType.ChargePaid
            or HeartPayWebhookEventType.ChargeFailed
            or HeartPayWebhookEventType.ChargeCancelled
            or HeartPayWebhookEventType.ChargeExpired;
    }

    private static bool IsWithdrawalEvent(HeartPayWebhookEventType eventType)
    {
        return eventType is HeartPayWebhookEventType.PayoutCreated
            or HeartPayWebhookEventType.PayoutUpdated
            or HeartPayWebhookEventType.PayoutCompleted
            or HeartPayWebhookEventType.PayoutFailed
            or HeartPayWebhookEventType.PayoutRejected
            or HeartPayWebhookEventType.PayoutCancelled;
    }

    private static string? ResolveTransactionId(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.ChargeId,
            req.CorrelationId,
            WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.ChargeId, p => p.CorrelationId),
            ResolveTxId(req),
            WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.Id),
            req.Id);
    }

    private static string? ResolvePayoutId(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.PayoutId,
            WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.PayoutId, p => p.CorrelationId, p => p.Id));
    }

    private static string? ResolveTxId(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.TxId,
            req.TxIdLower,
            WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.TxId, p => p.TxIdLower));
    }

    private static string? ResolveEndToEndId(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.EndToEndId,
            WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.EndToEndId, p => p.Pix?.EndToEndId));
    }

    private static string? ResolveErrorMessage(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmpty(
            req.ErrorMessage,
            WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.ErrorMessage));
    }

    private static DateTime? ResolvePaidAt(HeartPayWebhookRequest req)
    {
        return req.PaidAt
            ?? WebhookFieldResolver.FirstValueFromChain(req.Data, p => p.Data, p => p.PaidAt);
    }

    private static string? ResolvePixKey(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.Pix?.Key);
    }

    private static string? ResolvePixKeyType(HeartPayWebhookRequest req)
    {
        return WebhookFieldResolver.FirstNonEmptyFromChain(req.Data, p => p.Data, p => p.Pix?.KeyType);
    }
}

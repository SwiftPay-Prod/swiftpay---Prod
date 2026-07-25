using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.MagicPay.Models;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.MagicPay.Webhook;

public sealed class MagicPayWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<MagicPayWebhookEndpoint> logger
) : Endpoint<MagicPayWebhookRequest, MagicPayWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<MagicPayGroup>();
    }

    public override async Task HandleAsync(MagicPayWebhookRequest req, CancellationToken ct)
    {
        try
        {
            if (req.Data?.Transfer != null)
            {
                await ProcessTransferAsync(req.Data.Transfer, ct);
                await SendOkAsync(ct);
                return;
            }

            if (req.Data?.Payment != null)
            {
                await ProcessPaymentAsync(req.Data.Payment, ct);
                await SendOkAsync(ct);
                return;
            }

            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing MagicPay webhook: {WebhookId}", req.Id);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.MagicPay,
                "Erro interno ao processar webhook.",
                "internal_error",
                req,
                null,
                req.Data?.Payment?.Id,
                req.Data?.Transfer?.Id,
                ct);

            await Send.ResponseAsync(new MagicPayWebhookResponse(), 200, cancellation: ct);
        }
    }

    private async Task ProcessPaymentAsync(MagicPayPaymentResponse payment, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(payment.Id))
            return;

        var status = MagicPayStatusConverter.ToPaymentStatus(payment.Status);

        var result = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.MagicPay,
            AcquirerPaymentId = payment.Id,
            TxId = payment.ExternalRef ?? payment.Id,
            Status = status,
            EndToEndId = payment.Data?.E2e,
            PayerName = null,
            PayerDocument = null,
            ErrorMessage = status switch
            {
                PaymentStatus.Failed => "Pagamento recusado pela MagicPay.",
                PaymentStatus.Cancelled => "Pagamento cancelado na MagicPay.",
                _ => null
            }
        }, ct);

        if (!result.Success)
        {
            logger.LogError("Failed to process MagicPay payment webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.MagicPay,
                result.ErrorMessage,
                result.PaymentNotFound ? "transaction_not_found" : null,
                null,
                null,
                payment.Id,
                payment.Id,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.MagicPay,
            ApiLogStatus.Success,
            $"Webhook MagicPay payment processado com status {status}.",
            null,
            null,
            new { processed = true, status = status.ToString() },
            payment.Id,
            payment.Id,
            ct: ct);
    }

    private async Task ProcessTransferAsync(MagicPayTransferResponse transfer, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(transfer.Id))
            return;

        var status = MagicPayStatusConverter.ToWithdrawStatus(transfer.Status);
        var withdrawStatus = status switch
        {
            WithdrawStatus.Completed => PayoutStatus.Completed,
            WithdrawStatus.Failed => PayoutStatus.Failed,
            WithdrawStatus.Processing => PayoutStatus.Processing,
            _ => PayoutStatus.Processing
        };

        var rejectReason = withdrawStatus is PayoutStatus.Failed or PayoutStatus.Rejected
            ? "Transferencia recusada pela MagicPay."
            : null;

        var result = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
        {
            AcquirerType = AcquirerType.MagicPay,
            TxId = transfer.ExternalRef ?? transfer.Id,
            Status = withdrawStatus,
            AcquirerTransactionId = transfer.Id,
            RejectReason = rejectReason,
            CompletedAt = withdrawStatus == PayoutStatus.Completed ? (transfer.PaidAt ?? DateTime.UtcNow) : null
        }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.MagicPay,
                transfer.ExternalRef ?? transfer.Id,
                withdrawStatus,
                null,
                transfer.Id,
                rejectReason,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process MagicPay transfer webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.MagicPay,
                result.ErrorMessage,
                null,
                null,
                null,
                transfer.Id,
                transfer.Id,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.MagicPay,
            ApiLogStatus.Success,
            $"Webhook MagicPay transfer processado com status {withdrawStatus}.",
            null,
            new { processed = true, status = withdrawStatus.ToString(), payoutId = result.PayoutId },
            transfer.Id,
            transfer.Id,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new MagicPayWebhookResponse { Received = true }, 200, cancellation: ct);
    }
}

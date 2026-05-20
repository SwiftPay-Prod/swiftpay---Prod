using FastEndpoints;
using safefy_api_payment.Clients.ActivePayments.Models.Webhook;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_payment.EndpointsGroups.Acquirers;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Services.Helpers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Endpoints.Acquirers.ActivePayments.Webhook;

public sealed class ActivePaymentsWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<ActivePaymentsWebhookEndpoint> logger
) : Endpoint<ActivePaymentsWebhookRequest, ActivePaymentsWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<ActivePaymentsGroup>();
    }

    public override async Task HandleAsync(ActivePaymentsWebhookRequest req, CancellationToken ct)
    {
        try
        {
            if (req.Event == ActivePaymentsWebhookEventType.Ping)
            {
                await SendOkAsync(ct);
                return;
            }

            switch (req.Event)
            {
                case ActivePaymentsWebhookEventType.ChargePaid:
                case ActivePaymentsWebhookEventType.BilletPaid:
                case ActivePaymentsWebhookEventType.ChargeCancelled:
                case ActivePaymentsWebhookEventType.ChargeExpired:
                case ActivePaymentsWebhookEventType.BilletExpired:
                case ActivePaymentsWebhookEventType.ChargeFailed:
                    await ProcessChargeAsync(req, ct);
                    break;

                case ActivePaymentsWebhookEventType.WithdrawalCompleted:
                case ActivePaymentsWebhookEventType.WithdrawalDone:
                case ActivePaymentsWebhookEventType.WithdrawalApproved:
                case ActivePaymentsWebhookEventType.WithdrawalFailed:
                case ActivePaymentsWebhookEventType.WithdrawalRejected:
                    await ProcessWithdrawalAsync(req, ct);
                    break;

                default:
                    if (req.Withdrawal != null)
                    {
                        await ProcessWithdrawalAsync(req, ct);
                        break;
                    }

                    if (req.Charge != null)
                    {
                        await ProcessChargeAsync(req, ct);
                        break;
                    }

                    await SendOkAsync(ct);
                    return;
            }

            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing ActivePayments webhook");
            var response = new ActivePaymentsWebhookResponse { Received = false };
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.ActivePayments,
                "Erro interno ao processar webhook.",
                "internal_error",
                req,
                response,
                req.Charge?.ChargeId,
                req.Withdrawal?.WithdrawalId,
                ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
    }

    private async Task ProcessChargeAsync(ActivePaymentsWebhookRequest req, CancellationToken ct)
    {
        var data = req.Charge;
        if (data == null || string.IsNullOrEmpty(data.ChargeId))
        {
            return;
        }

        var eventStatus = ActivePaymentsStatusConverter.ToPaymentStatus(req.Event);
        var payloadStatus = ActivePaymentsStatusConverter.ToPaymentStatus(data.Status);
        var status = ResolvePaymentStatus(eventStatus, payloadStatus);

        Guid? externalReferenceId = null;
        if (!string.IsNullOrWhiteSpace(data.ExternalReference) && Guid.TryParse(data.ExternalReference, out var parsedId))
        {
            externalReferenceId = parsedId;
        }

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.ActivePayments,
                AcquirerPaymentId = data.ChargeId,
                ExternalId = externalReferenceId,
                Status = status,
                EndToEndId = data.EndToEnd,
                PayerName = data.Customer?.Name,
                PayerDocument = data.Customer?.Cpf,
                ErrorMessage = status switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Expired => "Pagamento expirado",
                    PaymentStatus.Failed => "Falha no processamento",
                    _ => null
                }
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process ActivePayments webhook: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.ActivePayments,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                data.ChargeId,
                data.ChargeId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.ActivePayments,
            ApiLogStatus.Success,
            $"Webhook ActivePayments charge processado com evento {req.Event} e status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            data.ChargeId,
            data.ChargeId,
            ct: ct);
    }

    private async Task ProcessWithdrawalAsync(ActivePaymentsWebhookRequest req, CancellationToken ct)
    {
        var data = req.Withdrawal;
        if (data == null || string.IsNullOrEmpty(data.WithdrawalId))
        {
            return;
        }

        var eventStatus = ActivePaymentsStatusConverter.ToPayoutStatus(req.Event);
        var payloadStatus = ActivePaymentsStatusConverter.ToPayoutStatus(data.Status);
        var status = ResolvePayoutStatus(eventStatus, payloadStatus);

        var result = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.ActivePayments,
                TxId = data.WithdrawalId,
                ExternalId = data.ExternalReference,
                Status = status,
                EndToEndId = data.EndToEnd,
                AcquirerTransactionId = data.WithdrawalId,
                RejectReason = status is PayoutStatus.Failed or PayoutStatus.Rejected
                    ? (data.ErrorMessage ?? "Falha no processamento do saque")
                    : null,
                CompletedAt = status == PayoutStatus.Completed
                    ? (data.ProcessedAt ?? data.CompletedAt ?? DateTime.UtcNow)
                    : null
            }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.ActivePayments,
                data.WithdrawalId!,
                status,
                data.EndToEnd,
                data.WithdrawalId,
                status is PayoutStatus.Failed or PayoutStatus.Rejected
                    ? (data.ErrorMessage ?? "Falha no processamento do saque")
                    : null,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process ActivePayments withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.ActivePayments,
                result.ErrorMessage,
                null,
                req,
                null,
                data.WithdrawalId,
                data.WithdrawalId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.ActivePayments,
            ApiLogStatus.Success,
            $"Webhook ActivePayments withdrawal processado com evento {req.Event} e status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
            data.WithdrawalId,
            data.WithdrawalId,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new ActivePaymentsWebhookResponse { Received = true }, 200, cancellation: ct);
    }

    private static PaymentStatus ResolvePaymentStatus(PaymentStatus eventStatus, PaymentStatus payloadStatus)
    {
        if (payloadStatus == PaymentStatus.Failed)
            return PaymentStatus.Failed;

        if (payloadStatus == PaymentStatus.Cancelled)
            return PaymentStatus.Cancelled;

        if (payloadStatus == PaymentStatus.Expired)
            return PaymentStatus.Expired;

        if (payloadStatus == PaymentStatus.Completed)
            return PaymentStatus.Completed;

        return eventStatus;
    }

    private static PayoutStatus ResolvePayoutStatus(PayoutStatus eventStatus, PayoutStatus payloadStatus)
    {
        if (payloadStatus == PayoutStatus.Failed)
            return PayoutStatus.Failed;

        if (payloadStatus == PayoutStatus.Rejected)
            return PayoutStatus.Rejected;

        if (payloadStatus == PayoutStatus.Completed)
            return PayoutStatus.Completed;

        return eventStatus;
    }
}

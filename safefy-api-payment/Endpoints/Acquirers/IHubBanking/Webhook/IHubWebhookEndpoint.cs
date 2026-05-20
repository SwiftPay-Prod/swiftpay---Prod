using FastEndpoints;
using safefy_api_payment.Clients.IHubBanking.Models.Webhook;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_payment.EndpointsGroups.Acquirers;
using safefy_api_payment.Services.Helpers;

namespace safefy_api_payment.Endpoints.Acquirers.IHubBanking.Webhook;

/// <summary>
/// Endpoint para receber webhooks do IHub Banking (Webhook V2).
/// Processa eventos de cash-in (pagamentos) e cash-out (saques).
/// </summary>
public sealed class IHubWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<IHubWebhookEndpoint> logger
) : Endpoint<IHubWebhookRequest, IHubWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<IHubBankingGroup>();
    }

    public override async Task HandleAsync(IHubWebhookRequest req, CancellationToken ct)
    {
        try
        {
            // Processar baseado no tipo de evento
            switch (req.Event)
            {
                case IHubWebhookEventType.CashInPaid:
                    await ProcessCashInPaidAsync(req, ct);
                    break;

                case IHubWebhookEventType.CashInRefunded:
                    await ProcessCashInRefundedAsync(req, ct);
                    break;

                case IHubWebhookEventType.CashInFailed:
                case IHubWebhookEventType.CashInCancelled:
                case IHubWebhookEventType.CashInExpired:
                    await ProcessCashInFailedAsync(req, req.Event, ct);
                    break;

                case IHubWebhookEventType.CashOutSuccess:
                    await ProcessCashOutSuccessAsync(req, ct);
                    break;

                case IHubWebhookEventType.CashOutFailed:
                case IHubWebhookEventType.CashOutError:
                case IHubWebhookEventType.CashOutRejected:
                    await ProcessCashOutFailedAsync(req, ct);
                    break;

                case IHubWebhookEventType.CashOutReturned:
                    await ProcessCashOutReturnedAsync(req, ct);
                    break;

                default:
                    await SendOkAsync(ct);
                    return;
            }

            await Send.ResponseAsync(new IHubWebhookResponse
            {
                Data = new IHubWebhookData { Processed = true }
            }, 200, cancellation: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing IHub webhook");
            var response = new IHubWebhookResponse
            {
                Data = new IHubWebhookData { Processed = false },
                Error = new ApiErrorResponse("Erro interno ao processar webhook.", "internal_error")
            };
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                response.Error?.Message,
                response.Error?.Code,
                req,
                response,
                req.Payload.TransactionId,
                req.Payload.WithdrawalId,
                ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
    }

    private async Task ProcessCashInFailedAsync(IHubWebhookRequest req, IHubWebhookEventType eventType, CancellationToken ct)
    {
        var transactionId = req.Payload.TransactionId;
        if (string.IsNullOrEmpty(transactionId))
        {
            return;
        }

        Guid? externalId = Guid.TryParse(req.Payload.ExternalId, out var parsedId) ? parsedId : null;
        var status = eventType switch
        {
            IHubWebhookEventType.CashInExpired => PaymentStatus.Expired,
            IHubWebhookEventType.CashInCancelled => PaymentStatus.Cancelled,
            _ => PaymentStatus.Failed
        };

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                AcquirerPaymentId = transactionId,
                ExternalId = externalId,
                Status = status,
                EndToEndId = req.Payload.EndToEndId,
                ErrorMessage = req.Payload.ErrorMessage ?? "Falha no processamento do pagamento"
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process IHub {Event}: {Error}", eventType, processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                processingResult.ErrorMessage,
                null,
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
            AcquirerType.IHubBanking,
            ApiLogStatus.Warning,
            $"Webhook IHub {eventType} processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            transactionId,
            transactionId,
            ct: ct);
    }

    /// <summary>
    /// Processa evento de pagamento PIX confirmado (cashin.paid).
    /// </summary>
    private async Task ProcessCashInPaidAsync(IHubWebhookRequest req, CancellationToken ct)
    {
        var transactionId = req.Payload.TransactionId;
        if (string.IsNullOrEmpty(transactionId))
        {
            return;
        }

        // Parseia ExternalId se for GUID válido
        Guid? externalId = Guid.TryParse(req.Payload.ExternalId, out var parsedId) ? parsedId : null;

        // Delegar ao serviço centralizado de processamento
        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                AcquirerPaymentId = transactionId,
                ExternalId = externalId,
                Status = PaymentStatus.Completed,
                EndToEndId = req.Payload.EndToEndId,
                PayerName = req.Payload.Payer?.Name,
                PayerDocument = req.Payload.Payer?.Document,
                PayerBank = req.Payload.Payer?.Institution
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process IHub cashin.paid: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                processingResult.ErrorMessage,
                null,
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
            AcquirerType.IHubBanking,
            ApiLogStatus.Success,
            "Webhook IHub cashin.paid processado com status Completed.",
            null,
            req,
            new { processed = true, status = PaymentStatus.Completed.ToString() },
            transactionId,
            transactionId,
            ct: ct);
    }

    /// <summary>
    /// Processa evento de estorno de pagamento (cashin.refunded).
    /// A IHub só suporta reembolso total.
    /// </summary>
    private async Task ProcessCashInRefundedAsync(IHubWebhookRequest req, CancellationToken ct)
    {
        var transactionId = req.Payload.TransactionId;
        if (string.IsNullOrEmpty(transactionId))
        {
            return;
        }

        // Parseia ExternalId se for GUID válido
        Guid? externalId = Guid.TryParse(req.Payload.ExternalId, out var parsedId) ? parsedId : null;

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                AcquirerPaymentId = transactionId,
                ExternalId = externalId,
                Status = PaymentStatus.Refunded,
                EndToEndId = req.Payload.EndToEndId,
                RefundedAmount = req.Payload.Amount
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process IHub cashin.refunded: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                processingResult.ErrorMessage,
                null,
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
            AcquirerType.IHubBanking,
            ApiLogStatus.Success,
            "Webhook IHub cashin.refunded processado com status Refunded.",
            null,
            req,
            new { processed = true, status = PaymentStatus.Refunded.ToString() },
            transactionId,
            transactionId,
            ct: ct);
    }

    /// <summary>
    /// Processa evento de saque aprovado (cashout.success).
    /// </summary>
    private async Task ProcessCashOutSuccessAsync(IHubWebhookRequest req, CancellationToken ct)
    {
        var withdrawalId = req.Payload.WithdrawalId;
        if (string.IsNullOrEmpty(withdrawalId))
        {
            return;
        }

        var processingResult = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                TxId = withdrawalId,
                ExternalId = req.Payload.ExternalId,
                Status = PayoutStatus.Completed,
                EndToEndId = req.Payload.EndToEndId,
                AcquirerTransactionId = withdrawalId,
                ReceiverName = req.Payload.Receiver?.Name,
                ReceiverDocument = req.Payload.Receiver?.Document,
                CompletedAt = DateTime.UtcNow
            }, ct);

        if (processingResult.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.IHubBanking,
                withdrawalId,
                PayoutStatus.Completed,
                req.Payload.EndToEndId,
                withdrawalId,
                null,
                ct);
            return;
        }

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process IHub cashout.success: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                withdrawalId,
                withdrawalId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.IHubBanking,
            ApiLogStatus.Success,
            "Webhook IHub cashout.success processado com status Completed.",
            null,
            req,
            new { processed = true, status = PayoutStatus.Completed.ToString(), payoutId = processingResult.PayoutId },
            withdrawalId,
            withdrawalId,
            ct: ct);
    }

    /// <summary>
    /// Processa evento de saque falhado (cashout.failed).
    /// </summary>
    private async Task ProcessCashOutFailedAsync(IHubWebhookRequest req, CancellationToken ct)
    {
        var withdrawalId = req.Payload.WithdrawalId;
        if (string.IsNullOrEmpty(withdrawalId))
        {
            return;
        }

        var processingResult = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                TxId = withdrawalId,
                ExternalId = req.Payload.ExternalId,
                Status = PayoutStatus.Failed,
                AcquirerTransactionId = withdrawalId,
                RejectReason = req.Payload.ErrorMessage ?? "Falha no processamento do saque"
            }, ct);

        if (processingResult.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.IHubBanking,
                withdrawalId,
                PayoutStatus.Failed,
                null,
                withdrawalId,
                req.Payload.ErrorMessage ?? "Falha no processamento do saque",
                ct);
            return;
        }

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process IHub cashout.failed: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                withdrawalId,
                withdrawalId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.IHubBanking,
            ApiLogStatus.Warning,
            "Webhook IHub cashout.failed processado com status Failed.",
            null,
            req,
            new { processed = true, status = PayoutStatus.Failed.ToString(), payoutId = processingResult.PayoutId },
            withdrawalId,
            withdrawalId,
            ct: ct);
    }

    /// <summary>
    /// Processa evento de saque devolvido (cashout.returned).
    /// </summary>
    private async Task ProcessCashOutReturnedAsync(IHubWebhookRequest req, CancellationToken ct)
    {
        var withdrawalId = req.Payload.WithdrawalId;
        if (string.IsNullOrEmpty(withdrawalId))
        {
            return;
        }

        var processingResult = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                TxId = withdrawalId,
                ExternalId = req.Payload.ExternalId,
                Status = PayoutStatus.Failed,
                AcquirerTransactionId = withdrawalId,
                RejectReason = "Saque devolvido pela instituição de destino"
            }, ct);

        if (processingResult.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.IHubBanking,
                withdrawalId,
                PayoutStatus.Failed,
                null,
                withdrawalId,
                "Saque devolvido pela instituição de destino",
                ct);
            return;
        }

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process IHub cashout.returned: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.IHubBanking,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                withdrawalId,
                withdrawalId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.IHubBanking,
            ApiLogStatus.Warning,
            "Webhook IHub cashout.returned processado com status Failed.",
            null,
            req,
            new { processed = true, status = PayoutStatus.Failed.ToString(), payoutId = processingResult.PayoutId },
            withdrawalId,
            withdrawalId,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new IHubWebhookResponse
        {
            Data = new IHubWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }
}

using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Acquirers.AkkadPag.Webhook;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.AkkadPag.Webhook;

public sealed class AkkadPagTransactionWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<AkkadPagTransactionWebhookEndpoint> logger
) : Endpoint<AkkadPagTransactionWebhookRequest, AkkadPagWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks/transactions");
        Group<AkkadPagGroup>();
    }

    public override async Task HandleAsync(AkkadPagTransactionWebhookRequest req, CancellationToken ct)
    {
        try
        {
            if (req.Transaction is null || string.IsNullOrWhiteSpace(req.Transaction.Id))
            {
                await SendOkAsync(ct);
                return;
            }

            await ProcessTransactionAsync(req.Transaction, ct);
            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing AkkadPag transaction webhook: {TransactionId}", req.Transaction?.Id);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.AkkadPag,
                "Erro interno ao processar webhook de transacao.",
                "internal_error",
                req,
                null,
                req.Transaction?.Id,
                null,
                ct);

            await Send.ResponseAsync(new AkkadPagWebhookResponse(), 200, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(AkkadPagTransactionWebhookTransaction transaction, CancellationToken ct)
    {
        var status = AkkadPagStatusConverter.ToPaymentStatus(transaction.Status);

        var result = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.AkkadPag,
            AcquirerPaymentId = transaction.Id,
            TxId = transaction.Id,
            Status = status,
            EndToEndId = transaction.Pix?.EndToEnd,
            PayerName = transaction.Payer?.Name,
            PayerDocument = transaction.Payer?.Document?.Number,
            ErrorMessage = status switch
            {
                PaymentStatus.Failed => "Pagamento recusado pela AkkadPag.",
                PaymentStatus.Cancelled => "Pagamento cancelado na AkkadPag.",
                _ => null
            }
        }, ct);

        if (!result.Success)
        {
            logger.LogError("Failed to process AkkadPag transaction webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.AkkadPag,
                result.ErrorMessage,
                result.PaymentNotFound ? "transaction_not_found" : null,
                null,
                null,
                transaction.Id,
                null,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.AkkadPag,
            ApiLogStatus.Success,
            $"Webhook AkkadPag transaction processado com status {status}.",
            null,
            new { processed = true, status = status.ToString() },
            transaction.Id,
            transaction.Id,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new AkkadPagWebhookResponse(), 200, cancellation: ct);
    }
}

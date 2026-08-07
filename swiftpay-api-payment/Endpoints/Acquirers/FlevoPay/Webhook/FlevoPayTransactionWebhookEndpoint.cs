using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Acquirers.FlevoPay.Webhook;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.FlevoPay.Webhook;

public sealed class FlevoPayTransactionWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<FlevoPayTransactionWebhookEndpoint> logger
) : Endpoint<FlevoPayTransactionWebhookRequest, FlevoPayWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks/transactions");
        Group<FlevoPayGroup>();
    }

    public override async Task HandleAsync(FlevoPayTransactionWebhookRequest req, CancellationToken ct)
    {
        try
        {
            var transactionId = req.TransactionId?.ToString();
            if (string.IsNullOrWhiteSpace(transactionId))
            {
                await SendOkAsync(ct);
                return;
            }

            await ProcessTransactionAsync(req, transactionId, ct);
            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing FlevoPay transaction webhook: {TransactionId}", req.TransactionId);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.FlevoPay,
                "Erro interno ao processar webhook de transacao.",
                "internal_error",
                req,
                null,
                req.TransactionId?.ToString(),
                null,
                ct);

            await Send.ResponseAsync(new FlevoPayWebhookResponse(), 200, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(FlevoPayTransactionWebhookRequest req, string transactionId, CancellationToken ct)
    {
        var status = FlevoPayStatusConverter.ToPaymentStatus(req.Status);

        var result = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.FlevoPay,
            AcquirerPaymentId = transactionId,
            TxId = req.ExternalId ?? transactionId,
            Status = status,
            PayerName = req.Customer?.Name,
            PayerDocument = req.Customer?.Document,
            ErrorMessage = status switch
            {
                PaymentStatus.Failed => "Pagamento recusado pela FlevoPay.",
                PaymentStatus.Cancelled => "Pagamento cancelado na FlevoPay.",
                _ => null
            }
        }, ct);

        if (!result.Success)
        {
            logger.LogError("Failed to process FlevoPay transaction webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.FlevoPay,
                result.ErrorMessage,
                result.PaymentNotFound ? "transaction_not_found" : null,
                null,
                null,
                transactionId,
                null,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.FlevoPay,
            ApiLogStatus.Success,
            $"Webhook FlevoPay transaction processado com status {status}.",
            null,
            new { processed = true, status = status.ToString() },
            transactionId,
            transactionId,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new FlevoPayWebhookResponse(), 200, cancellation: ct);
    }
}
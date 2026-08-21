using FastEndpoints;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.PixHub.Models;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.PixHub.Webhook;

public sealed class PixHubWebhookResponse
{
    public bool Success { get; set; } = true;
}

public sealed class PixHubWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    IPlatformPayoutWebhookService payoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<PixHubWebhookEndpoint> logger
) : Endpoint<PixHubWebhookPayload, PixHubWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<PixHubGroup>();
    }

    public override async Task HandleAsync(PixHubWebhookPayload req, CancellationToken ct)
    {
        try
        {
            if (req.Type == "transaction" && req.Transaction != null)
            {
                await ProcessTransactionAsync(req.Transaction, req.Event, ct);
            }
            else if (req.Type == "transfer" && req.Transfer != null)
            {
                await ProcessTransferAsync(req.Transfer, req.Event, ct);
            }

            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unexpected error processing PixHub webhook event {Event}", req.Event);
            await SendOkAsync(ct);
        }
    }

    private async Task ProcessTransactionAsync(PixHubWebhookTransaction transaction, string? eventType, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(transaction.Id)) return;

        var status = PixHubStatusConverter.ConvertTransactionStatus(transaction.Status);

        var result = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.PixHub,
            AcquirerPaymentId = transaction.Id,
            TxId = transaction.Id,
            Status = status,
            EndToEndId = transaction.Pix?.EndToEndId,
            PayerName = transaction.Pix?.PayerInfo?.Name,
            PayerDocument = transaction.Pix?.PayerInfo?.Document
        }, ct);

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.PixHub,
            result.Success ? ApiLogStatus.Success : ApiLogStatus.Warning,
            $"Webhook PixHub transaction {transaction.Id} processado com status {status}.",
            null,
            new { processed = result.Success, status = status.ToString() },
            transaction.Id,
            transaction.Id,
            ct: ct);
    }

    private async Task ProcessTransferAsync(PixHubWebhookTransfer transfer, string? eventType, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(transfer.Id)) return;

        var status = PixHubStatusConverter.ConvertTransferStatus(transfer.Status);

        var processed = await payoutWebhookService.TryProcessWebhookAsync(
            AcquirerType.PixHub,
            transfer.Id,
            status,
            transfer.Pix?.EndToEndId,
            transfer.Id,
            null,
            ct);

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.PixHub,
            processed ? ApiLogStatus.Success : ApiLogStatus.Warning,
            $"Webhook PixHub transfer {transfer.Id} processado com status {status}.",
            null,
            new { processed, status = status.ToString() },
            transfer.Id,
            transfer.Id,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new PixHubWebhookResponse(), 200, cancellation: ct);
    }
}

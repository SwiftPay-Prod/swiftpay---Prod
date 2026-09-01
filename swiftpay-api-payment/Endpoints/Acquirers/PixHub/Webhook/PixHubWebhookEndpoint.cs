using System.Text.Json;
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
) : EndpointWithoutRequest<PixHubWebhookResponse>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public override void Configure()
    {
        Post("webhooks");
        Group<PixHubGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        using var bodyBuffer = new MemoryStream();
        await HttpContext.Request.Body.CopyToAsync(bodyBuffer, ct);
        var rawBody = bodyBuffer.ToArray();

        PixHubWebhookPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<PixHubWebhookPayload>(rawBody, JsonOptions);
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "PixHub webhook rejected because payload is invalid JSON");
            await Send.ResponseAsync(new PixHubWebhookResponse { Success = false }, 400, cancellation: ct);
            return;
        }

        if (payload is null)
        {
            await Send.ResponseAsync(new PixHubWebhookResponse { Success = false }, 400, cancellation: ct);
            return;
        }

        try
        {
            if (payload.Type == "transaction" && payload.Transaction != null)
            {
                await ProcessTransactionAsync(payload.Transaction, ct);
            }
            else if (payload.Type == "transfer" && payload.Transfer != null)
            {
                await ProcessTransferAsync(payload.Transfer, ct);
            }
            else
            {
                logger.LogWarning("PixHub webhook recebido sem transaction/transfer: Type={Type}, Event={Event}, HasTransaction={HasTransaction}, HasTransfer={HasTransfer}, RawBody={RawBody}",
                    payload.Type, payload.Event, payload.Transaction != null, payload.Transfer != null, System.Text.Encoding.UTF8.GetString(rawBody));
                await WebhookLogHelper.LogEventAsync(
                    apiLogService,
                    dbContext,
                    HttpContext,
                    AcquirerType.PixHub,
                    ApiLogStatus.Warning,
                    $"Webhook PixHub recebido sem payload processável: Type={payload.Type}, Event={payload.Event}",
                    null,
                    new { hasTransaction = payload.Transaction != null, hasTransfer = payload.Transfer != null },
                    payload.Id ?? payload.Transaction?.Id ?? payload.Transfer?.Id,
                    payload.Id ?? payload.Transaction?.Id ?? payload.Transfer?.Id,
                    ct: ct);
            }

            await Send.OkAsync(new PixHubWebhookResponse(), ct);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unexpected error processing PixHub webhook event {Event}", payload.Event);
            await Send.ResponseAsync(new PixHubWebhookResponse { Success = false }, 500, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(PixHubWebhookTransaction transaction, CancellationToken ct)
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

    private async Task ProcessTransferAsync(PixHubWebhookTransfer transfer, CancellationToken ct)
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
}

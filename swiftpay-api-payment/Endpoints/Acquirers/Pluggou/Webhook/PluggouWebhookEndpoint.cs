using FastEndpoints;
using swiftpay_api_payment.Clients.Pluggou.Models.Webhook;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Helpers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Endpoints.Acquirers.Pluggou.Webhook;

public sealed class PluggouWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<PluggouWebhookEndpoint> logger
) : Endpoint<PluggouWebhookRequest, PluggouWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<PluggouGroup>();
    }

    public override async Task HandleAsync(PluggouWebhookRequest req, CancellationToken ct)
    {
        try
        {
            switch (req.EventType)
            {
                case PluggouWebhookEventType.Transaction:
                    await ProcessTransactionAsync(req.Data, ct);
                    break;
                case PluggouWebhookEventType.Withdrawal:
                    await ProcessWithdrawalAsync(req.Data, ct);
                    break;
                default:
                    await SendOkAsync(ct);
                    return;
            }

            await Send.ResponseAsync(new PluggouWebhookResponse
            {
                Data = new PluggouWebhookData { Processed = true }
            }, 200, cancellation: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Pluggou webhook");
            var response = new PluggouWebhookResponse
            {
                Data = new PluggouWebhookData { Processed = false },
                Error = new("Erro interno ao processar webhook.")
            };
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Pluggou,
                response.Error?.Message,
                "internal_error",
                req,
                response,
                req.Data?.Id,
                req.Data?.Id,
                ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(PluggouWebhookPayload? data, CancellationToken ct)
    {
        if (data == null || string.IsNullOrWhiteSpace(data.Id))
        {
            return;
        }

        var status = PluggouStatusConverter.ToPaymentStatus(data.Status);

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Pluggou,
                AcquirerPaymentId = data.Id,
                Status = status,
                EndToEndId = data.EndToEndId,
                ErrorMessage = status switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Expired => "Pagamento expirado",
                    PaymentStatus.Failed => "Falha no pagamento",
                    PaymentStatus.Refunded => "Pagamento estornado",
                    _ => null
                }
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process Pluggou transaction webhook: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Pluggou,
                processingResult.ErrorMessage,
                null,
                data,
                null,
                data.Id,
                data.Id,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Pluggou,
            ApiLogStatus.Success,
            $"Webhook Pluggou transaction processado com status {status}.",
            null,
            data,
            new { processed = true, status = status.ToString() },
            data.Id,
            data.Id,
            ct: ct);
    }

    private async Task ProcessWithdrawalAsync(PluggouWebhookPayload? data, CancellationToken ct)
    {
        if (data == null || string.IsNullOrWhiteSpace(data.Id))
        {
            return;
        }

        var status = PluggouStatusConverter.ToPayoutStatus(data.Status);

        var result = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Pluggou,
                TxId = data.Id,
                Status = status,
                EndToEndId = data.EndToEndId,
                AcquirerTransactionId = data.Id,
                RejectReason = status == PayoutStatus.Failed ? "Falha no processamento do saque" : null,
                CompletedAt = status == PayoutStatus.Completed ? (data.PaidAt ?? DateTime.UtcNow) : null
            }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.Pluggou,
                data.Id!,
                status,
                data.EndToEndId,
                data.Id,
                status == PayoutStatus.Failed ? "Falha no processamento do saque" : null,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process Pluggou withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Pluggou,
                result.ErrorMessage,
                null,
                data,
                null,
                data.Id,
                data.Id,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Pluggou,
            ApiLogStatus.Success,
            $"Webhook Pluggou withdrawal processado com status {status}.",
            null,
            data,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
            data.Id,
            data.Id,
            ct: ct);
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new PluggouWebhookResponse
        {
            Data = new PluggouWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }
}

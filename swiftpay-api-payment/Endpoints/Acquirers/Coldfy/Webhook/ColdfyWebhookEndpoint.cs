using FastEndpoints;
using safefy_api_payment.Clients.Coldfy.Models.Webhook;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.EndpointsGroups.Acquirers;
using safefy_api_payment.Interfaces;
using safefy_api_core.Models.Database;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_payment.Services.Helpers;
using safefy_api_payment.Services.Acquirers.Utils;

namespace safefy_api_payment.Endpoints.Acquirers.Coldfy.Webhook;

public sealed class ColdfyWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<ColdfyWebhookEndpoint> logger
) : Endpoint<ColdfyWebhookRequest, ColdfyWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<ColdfyGroup>();
    }

    public override async Task HandleAsync(ColdfyWebhookRequest req, CancellationToken ct)
    {
        try
        {
            if (IsWithdrawalWebhook(req))
            {
                await ProcessWithdrawalAsync(req, ct);
                await SendOkAsync(ct);
                return;
            }

            if (IsTransactionWebhook(req))
            {
                await ProcessTransactionAsync(req, ct);
                await SendOkAsync(ct);
                return;
            }

            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Coldfy webhook");
            var response = new ColdfyWebhookResponse
            {
                Data = new ColdfyWebhookData { Processed = false },
                Error = new ApiErrorResponse("Erro interno ao processar webhook.", "internal_error")
            };
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Coldfy,
                response.Error?.Message,
                response.Error?.Code,
                req,
                response,
                req.Data?.Id,
                req.Withdrawal?.Id,
                ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
    }

    private static bool IsWithdrawalWebhook(ColdfyWebhookRequest req)
    {
        if (req.Withdrawal != null)
            return true;

        return req.Event.HasValue && req.Event != ColdfyWebhookEventType.Unknown;
    }

    private static bool IsTransactionWebhook(ColdfyWebhookRequest req)
    {
        return req.Type == ColdfyWebhookObjectType.Transaction && req.Data != null;
    }

    private async Task ProcessTransactionAsync(ColdfyWebhookRequest req, CancellationToken ct)
    {
        var data = req.Data;
        if (data == null || string.IsNullOrWhiteSpace(data.Id))
        {
            return;
        }

        var status = ColdfyStatusConverter.ToPaymentStatus(data.Status);

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Coldfy,
                AcquirerPaymentId = data.Id,
                Status = status,
                EndToEndId = data.Pix?.End2EndId,
                PayerName = data.Customer?.Name,
                PayerDocument = data.Customer?.Document,
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
            logger.LogError("Failed to process Coldfy transaction webhook: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Coldfy,
                processingResult.ErrorMessage,
                null,
                req,
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
            AcquirerType.Coldfy,
            ApiLogStatus.Success,
            $"Webhook Coldfy transaction processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            data.Id,
            data.Id,
            ct: ct);
    }

    private async Task ProcessWithdrawalAsync(ColdfyWebhookRequest req, CancellationToken ct)
    {
        var withdrawal = req.Withdrawal;
        if (withdrawal == null || string.IsNullOrWhiteSpace(withdrawal.Id))
        {
            return;
        }

        var status = ColdfyStatusConverter.ToPayoutStatus(req.Event, withdrawal.Status);

        var result = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Coldfy,
                TxId = withdrawal.Id,
                Status = status,
                EndToEndId = withdrawal.Pix?.EndToEndId,
                AcquirerTransactionId = withdrawal.Id,
                RejectReason = status == PayoutStatus.Failed ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque") : null,
                CompletedAt = status == PayoutStatus.Completed ? (withdrawal.PaidAt ?? DateTime.UtcNow) : null
            }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.Coldfy,
                withdrawal.Id!,
                status,
                withdrawal.Pix?.EndToEndId,
                withdrawal.Id,
                status == PayoutStatus.Failed ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque") : null,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process Coldfy withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Coldfy,
                result.ErrorMessage,
                null,
                req,
                null,
                withdrawal.Id,
                withdrawal.Id,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Coldfy,
            ApiLogStatus.Success,
            $"Webhook Coldfy withdrawal processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
            withdrawal.Id,
            withdrawal.Id,
            ct: ct);
    }
    
    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new ColdfyWebhookResponse
        {
            Data = new ColdfyWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }
    
}

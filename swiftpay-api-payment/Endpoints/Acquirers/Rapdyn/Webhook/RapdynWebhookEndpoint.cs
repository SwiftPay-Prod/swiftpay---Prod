using FastEndpoints;
using System.Globalization;
using System.Text.Json;
using swiftpay_api_payment.Clients.Rapdyn.Models.Webhook;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_payment.Services.Helpers;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Endpoints.Acquirers.Rapdyn.Webhook;

public sealed class RapdynWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<RapdynWebhookEndpoint> logger
) : Endpoint<RapdynWebhookRequest, RapdynWebhookResponse>
{
    public override void Configure()
    {
        Post("webhooks");
        Group<RapdynGroup>();
    }

    public override async Task HandleAsync(RapdynWebhookRequest req, CancellationToken ct)
    {
        try
        {
            var processed = true;

            switch (req.NotificationType)
            {
                case RapdynWebhookNotificationType.Transaction:
                    processed = await ProcessTransactionAsync(req, ct);
                    break;
                case RapdynWebhookNotificationType.TransferOut:
                    processed = await ProcessTransferAsync(req, ct);
                    break;
                default:
                    await SendOkAsync(ct);
                    return;
            }

            if (!processed)
            {
                var response = new RapdynWebhookResponse
                {
                    Data = new RapdynWebhookData { Processed = false },
                    Error = new ApiErrorResponse("Falha ao processar webhook.", "processing_failed")
                };

                await Send.ResponseAsync(response, 500, cancellation: ct);
                return;
            }

            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Rapdyn webhook");
            var response = new RapdynWebhookResponse
            {
                Data = new RapdynWebhookData { Processed = false },
                Error = new ApiErrorResponse("Erro interno ao processar webhook.", "internal_error")
            };
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Rapdyn,
                $"{response.Error?.Message} {ex.Message}",
                response.Error?.Code,
                req,
                response,
                req.TransactionId,
                req.TransferId,
                ct);
            await Send.ResponseAsync(response, 500, cancellation: ct);
        }
    }

    private async Task<bool> ProcessTransactionAsync(RapdynWebhookRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.TransactionId))
            return true;

        var status = RapdynStatusConverter.ToPaymentStatus(req.Status);
        Guid? externalId = null;

        if (!string.IsNullOrWhiteSpace(req.ExternalId) && Guid.TryParse(req.ExternalId, out var parsedId))
        {
            externalId = parsedId;
        }

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Rapdyn,
                AcquirerPaymentId = req.TransactionId,
                ExternalId = externalId,
                Status = status,
                EndToEndId = req.Pix?.EndToEndId,
                PayerName = req.Customer?.Name,
                PayerDocument = req.Customer?.Document?.Value,
                ErrorMessage = status switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Failed => "Falha no pagamento",
                    PaymentStatus.Refunded => "Pagamento estornado",
                    _ => null
                }
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process Rapdyn transaction webhook: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Rapdyn,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                req.TransactionId,
                req.TransactionId,
                ct);
            return false;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Rapdyn,
            ApiLogStatus.Success,
            $"Webhook Rapdyn transaction processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            req.TransactionId,
            req.TransactionId,
            ct: ct);

        return true;
    }

    private async Task<bool> ProcessTransferAsync(RapdynWebhookRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.TransferId))
            return true;

        var status = RapdynStatusConverter.ToPayoutStatus(req.Status);
        var rejectReason = status switch
        {
            PayoutStatus.Failed => "Falha no processamento do saque",
            PayoutStatus.Cancelled => "Saque cancelado na adquirente",
            _ => null
        };

        var result = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Rapdyn,
                TxId = req.TransferId,
                Status = status,
                EndToEndId = req.EndToEndId ?? req.Pix?.EndToEndId,
                AcquirerTransactionId = req.TransferId,
                PixKey = req.PixKey,
                PixKeyType = req.PixKeyType,
                Amount = ParseAmountInCents(req.Value),
                RejectReason = rejectReason,
                CompletedAt = status == PayoutStatus.Completed ? (req.Dates?.CompletedAt ?? DateTime.UtcNow) : null
            }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.Rapdyn,
                req.TransferId!,
                status,
                req.EndToEndId ?? req.Pix?.EndToEndId,
                req.TransferId,
                rejectReason,
                ct);
            return true;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process Rapdyn transfer webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Rapdyn,
                result.ErrorMessage,
                null,
                req,
                null,
                req.TransferId,
                req.TransferId,
                ct);
            return false;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Rapdyn,
            ApiLogStatus.Success,
            $"Webhook Rapdyn transfer_out processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
            req.TransferId,
            req.TransferId,
            ct: ct);

        if (result.Success && result.UsedFallbackCorrelation)
        {
            await LogFallbackCorrelationAsync(req, result, ct);
        }

        return true;
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new RapdynWebhookResponse
        {
            Data = new RapdynWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }

    private async Task LogFallbackCorrelationAsync(
        RapdynWebhookRequest req,
        ProcessCashoutWebhookResult result,
        CancellationToken ct)
    {
        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Rapdyn,
            ApiLogStatus.Warning,
            "Webhook Rapdyn processado via correlacao de fallback (valor + chave PIX).",
            null,
            req,
            new { processed = true, fallbackCorrelation = true, payoutId = result.PayoutId },
            req.TransferId,
            req.TransferId,
            ct: ct);
    }

    private static long? ParseAmountInCents(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalized = value.Trim();

        if (long.TryParse(normalized, NumberStyles.Integer, CultureInfo.InvariantCulture, out var asInt))
            return asInt;

        var onlyDigits = new string(normalized.Where(char.IsDigit).ToArray());
        if (string.IsNullOrWhiteSpace(onlyDigits))
            return null;

        if (normalized.Contains(',') || normalized.Contains("R$", StringComparison.OrdinalIgnoreCase))
        {
            if (long.TryParse(onlyDigits, NumberStyles.Integer, CultureInfo.InvariantCulture, out var centsFromFormatted))
                return centsFromFormatted;
        }

        return long.TryParse(onlyDigits, NumberStyles.Integer, CultureInfo.InvariantCulture, out var cents)
            ? cents
            : null;
    }
}

using System.Text.Json;
using FastEndpoints;
using safefy_api_payment.Clients.Accithus.Models.Webhook;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.EndpointsGroups.Acquirers;
using safefy_api_payment.Interfaces;
using safefy_api_payment.Services.Acquirers.Utils;
using safefy_api_payment.Services.Helpers;
using safefy_api_core.Database;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;

namespace safefy_api_payment.Endpoints.Acquirers.Accithus.Webhook;

public sealed class AccithusWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<AccithusWebhookEndpoint> logger
) : Endpoint<AccithusWebhookRequest, AccithusWebhookResponse>
{
    private static readonly JsonSerializerOptions SnakeCaseOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public override void Configure()
    {
        Post("webhooks");
        Group<AccithusGroup>();
    }

    public override async Task HandleAsync(AccithusWebhookRequest req, CancellationToken ct)
    {
        try
        {
            var eventLower = req.Event.Trim().ToLowerInvariant();

            if (eventLower.StartsWith("withdrawal.") || eventLower.StartsWith("payout."))
            {
                await ProcessWithdrawalAsync(req, ct);
                await SendOkAsync(ct);
                return;
            }

            if (eventLower.StartsWith("transaction.") || eventLower.StartsWith("payment."))
            {
                await ProcessTransactionAsync(req, ct);
                await SendOkAsync(ct);
                return;
            }

            await SendOkAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Accithus webhook");
            var response = new AccithusWebhookResponse
            {
                Data = new AccithusWebhookData { Processed = false },
                Error = new ApiErrorResponse("Erro interno ao processar webhook.", "internal_error")
            };
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Accithus,
                response.Error?.Message,
                response.Error?.Code,
                req,
                response,
                ct: ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
    }

    private async Task ProcessTransactionAsync(AccithusWebhookRequest req, CancellationToken ct)
    {
        var data = DeserializeData<AccithusWebhookTransactionData>(req.Data);
        if (data == null || string.IsNullOrWhiteSpace(data.Id))
            return;

        var status = AccithusStatusConverter.ToPaymentStatus(data.Status);

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Accithus,
                AcquirerPaymentId = data.Id,
                TxId = data.TxId,
                Status = status,
                EndToEndId = data.EndToEndId,
                PayerName = data.PayerName,
                PayerDocument = data.PayerDocument,
                PayerBank = data.PayerBank,
                ErrorMessage = data.ErrorMessage ?? status switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Expired => "Pagamento expirado",
                    PaymentStatus.Failed => "Falha no pagamento",
                    PaymentStatus.Refunded => "Pagamento estornado",
                    PaymentStatus.PartiallyRefunded => "Pagamento parcialmente estornado",
                    _ => null
                },
                RefundedAmount = data.RefundedAmount
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process Accithus transaction webhook: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Accithus,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                data.Id,
                data.TxId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Accithus,
            ApiLogStatus.Success,
            $"Webhook Accithus transaction processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString() },
            data.Id,
            data.TxId,
            ct: ct);
    }

    private async Task ProcessWithdrawalAsync(AccithusWebhookRequest req, CancellationToken ct)
    {
        var data = DeserializeData<AccithusWebhookWithdrawalData>(req.Data);
        if (data == null || string.IsNullOrWhiteSpace(data.Id))
            return;

        var status = AccithusStatusConverter.ToPayoutStatus(data.Status);

        DateTime? completedAt = null;
        if (status == PayoutStatus.Completed && !string.IsNullOrWhiteSpace(data.CompletedAt))
        {
            if (DateTime.TryParse(data.CompletedAt, out var parsed))
                completedAt = parsed.ToUniversalTime();
            else
                completedAt = DateTime.UtcNow;
        }
        else if (status == PayoutStatus.Completed)
        {
            completedAt = DateTime.UtcNow;
        }

        var result = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Accithus,
                TxId = data.Id,
                Status = status,
                ExternalId = data.Id,
                EndToEndId = data.EndToEndId,
                AcquirerTransactionId = data.Id,
                PixKey = data.PixKey,
                PixKeyType = data.PixKeyType,
                Amount = data.Amount,
                ReceiverName = data.ReceiverName,
                ReceiverDocument = data.ReceiverDocument,
                RejectReason = status is PayoutStatus.Failed or PayoutStatus.Rejected
                    ? (data.ErrorMessage ?? "Falha no processamento do saque")
                    : null,
                CompletedAt = completedAt
            }, ct);

        if (result.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.Accithus,
                data.Id!,
                status,
                data.EndToEndId,
                data.Id,
                status is PayoutStatus.Failed or PayoutStatus.Rejected
                    ? (data.ErrorMessage ?? "Falha no processamento do saque")
                    : null,
                ct);
            return;
        }

        if (!result.Success)
        {
            logger.LogError("Failed to process Accithus withdrawal webhook: {Error}", result.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Accithus,
                result.ErrorMessage,
                null,
                req,
                null,
                data.Id,
                data.TxId,
                ct);
            return;
        }

        await WebhookLogHelper.LogEventAsync(
            apiLogService,
            dbContext,
            HttpContext,
            AcquirerType.Accithus,
            ApiLogStatus.Success,
            $"Webhook Accithus withdrawal processado com status {status}.",
            null,
            req,
            new { processed = true, status = status.ToString(), payoutId = result.PayoutId },
            data.Id,
            data.TxId,
            ct: ct);
    }

    private static T? DeserializeData<T>(JsonElement element) where T : class
    {
        try
        {
            return element.Deserialize<T>(SnakeCaseOptions);
        }
        catch
        {
            return null;
        }
    }

    private Task SendOkAsync(CancellationToken ct)
    {
        return Send.ResponseAsync(new AccithusWebhookResponse
        {
            Data = new AccithusWebhookData { Processed = true }
        }, 200, cancellation: ct);
    }
}

using System.Text.Json;
using FastEndpoints;
using swiftpay_api_payment.Clients.Bankizi.Models.Webhook;
using swiftpay_api_payment.Endpoints.Models;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_payment.EndpointsGroups.Acquirers;
using swiftpay_api_payment.Services.Helpers;

namespace swiftpay_api_payment.Endpoints.Acquirers.Bankizi.Webhook;

public sealed class BankiziWebhookEndpoint(
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    PrimaryDbContext dbContext,
    IApiLogService apiLogService,
    ILogger<BankiziWebhookEndpoint> logger
) : Endpoint<BankiziWebhookRequest, BankiziWebhookResponse>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public override void Configure()
    {
        Post("webhooks");
        Group<BankiziGroup>();
    }

    public override async Task HandleAsync(BankiziWebhookRequest req, CancellationToken ct)
    {
        try
        {
            switch (req.Event)
            {
                case "PIX_IN":
                    await HandlePixInAsync(req, ct);
                    break;
                case "PIX_OUT":
                    await HandlePixOutAsync(req, ct);
                    break;
                default:
                    var invalidResponse = new BankiziWebhookResponse
                    {
                        Data = new BankiziWebhookData { Processed = false },
                        Error = new ApiErrorResponse($"Evento inválido: esperado 'PIX_IN' ou 'PIX_OUT', recebido '{req.Event}'", "invalid_event")
                    };
                    var inferredId = TryGetWebhookIdentifier(req.Data);
                    await WebhookLogHelper.LogErrorAsync(
                        apiLogService,
                        dbContext,
                        HttpContext,
                        AcquirerType.Bankizi,
                        invalidResponse.Error?.Message,
                        invalidResponse.Error?.Code,
                        req,
                        invalidResponse,
                        inferredId,
                        inferredId,
                        ct);
                    await Send.ResponseAsync(invalidResponse, 200, cancellation: ct);
                    return;
            }

            await Send.ResponseAsync(new BankiziWebhookResponse
            {
                Data = new BankiziWebhookData { Processed = true }
            }, 200, cancellation: ct);
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Error deserializing Bankizi webhook data");
            var response = new BankiziWebhookResponse
            {
                Data = new BankiziWebhookData { Processed = false },
                Error = new ApiErrorResponse("Formato de dados inválido.", "invalid_data")
            };
            var inferredId = TryGetWebhookIdentifier(req.Data);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Bankizi,
                response.Error?.Message,
                response.Error?.Code,
                req,
                response,
                inferredId,
                inferredId,
                ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error processing Bankizi webhook");
            var response = new BankiziWebhookResponse
            {
                Data = new BankiziWebhookData { Processed = false },
                Error = new ApiErrorResponse("Erro interno ao processar webhook.", "internal_error")
            };
            var inferredId = TryGetWebhookIdentifier(req.Data);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Bankizi,
                response.Error?.Message,
                response.Error?.Code,
                req,
                response,
                inferredId,
                inferredId,
                ct);
            await Send.ResponseAsync(response, 200, cancellation: ct);
        }
    }

    private static string? TryGetWebhookIdentifier(JsonElement data)
    {
        return WebhookFieldResolver.FirstJsonString(data, "transactionId", "txId", "id", "correlationID", "correlationId");
    }

    private async Task HandlePixInAsync(BankiziWebhookRequest req, CancellationToken ct)
    {
        var data = JsonSerializer.Deserialize<BankiziPixInData>(req.Data.GetRawText(), JsonOptions);
        if (data == null)
        {
            return;
        }

        var status = MapBankiziPixInStatus(data.Status);

        var processingResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(
            new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Bankizi,
                AcquirerPaymentId = data.TransactionId ?? data.TxId,
                TxId = data.TxId,
                Status = status,
                EndToEndId = data.EndToEndId,
                PayerName = data.PayerInfo?.Name,
                PayerDocument = data.PayerInfo?.Document,
                RefundedAmount = data.AmountRefunded
            }, ct);

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process PIX_IN payment: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Bankizi,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                data.TransactionId ?? data.TxId,
                data.TxId,
                ct);
        }
    }

    private async Task HandlePixOutAsync(BankiziWebhookRequest req, CancellationToken ct)
    {
        var data = JsonSerializer.Deserialize<BankiziPixOutData>(req.Data.GetRawText(), JsonOptions);
        if (data == null)
        {
            return;
        }

        var payoutStatus = MapBankiziPixOutStatus(data.Status);

        var processingResult = await cashoutService.ProcessAcquirerWebhookAsync(
            new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Bankizi,
                TxId = data.TxId,
                Status = payoutStatus,
                EndToEndId = data.EndToEndId,
                AcquirerTransactionId = data.TransactionId,
                RejectReason = data.RejectReason,
                CompletedAt = data.PaidAt
            }, ct);

        if (processingResult.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.Bankizi,
                data.TxId ?? string.Empty,
                payoutStatus,
                data.EndToEndId,
                data.TransactionId,
                data.RejectReason,
                ct);
            return;
        }

        if (!processingResult.Success)
        {
            logger.LogError("Failed to process PIX_OUT payout: {Error}", processingResult.ErrorMessage);
            await WebhookLogHelper.LogErrorAsync(
                apiLogService,
                dbContext,
                HttpContext,
                AcquirerType.Bankizi,
                processingResult.ErrorMessage,
                null,
                req,
                null,
                data.TransactionId ?? data.TxId,
                data.TxId,
                ct);
        }
    }

    private static PaymentStatus MapBankiziPixInStatus(BankiziPixStatus status)
    {
        return status switch
        {
            BankiziPixStatus.Generated => PaymentStatus.Pending,
            BankiziPixStatus.Paid => PaymentStatus.Completed,
            BankiziPixStatus.RequestedRefund => PaymentStatus.Processing,
            BankiziPixStatus.Refunded => PaymentStatus.Refunded,
            BankiziPixStatus.PartiallyRefunded => PaymentStatus.PartiallyRefunded,
            BankiziPixStatus.Expired => PaymentStatus.Expired,
            BankiziPixStatus.Cancelled => PaymentStatus.Cancelled,
            _ => PaymentStatus.Pending
        };
    }

    private static PayoutStatus MapBankiziPixOutStatus(BankiziPixOutStatus status)
    {
        return status switch
        {
            BankiziPixOutStatus.Generated => PayoutStatus.Processing,
            BankiziPixOutStatus.Done => PayoutStatus.Completed,
            BankiziPixOutStatus.Failed => PayoutStatus.Failed,
            BankiziPixOutStatus.Reject => PayoutStatus.Rejected,
            BankiziPixOutStatus.Refunded => PayoutStatus.Failed, // Treat as failed since money returned
            BankiziPixOutStatus.PartiallyRefunded => PayoutStatus.Failed, // Treat as failed since partial
            _ => PayoutStatus.Processing
        };
    }
}

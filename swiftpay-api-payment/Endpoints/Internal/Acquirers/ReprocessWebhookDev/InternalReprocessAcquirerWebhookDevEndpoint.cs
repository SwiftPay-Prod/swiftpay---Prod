using System.Text.Json;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.ActivePayments.Models.Webhook;
using swiftpay_api_payment.Clients.Bankizi.Models.Webhook;
using swiftpay_api_payment.Clients.Coldfy.Models.Webhook;
using swiftpay_api_payment.Clients.HunterPay.Models.Webhook;
using swiftpay_api_payment.Clients.IHubBanking.Models.Webhook;
using swiftpay_api_payment.Clients.Pluggou.Models.Webhook;
using swiftpay_api_payment.Clients.Rapdyn.Models.Webhook;
using swiftpay_api_payment.Endpoints.Acquirers.Bankizi.Webhook;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_payment.Services.Acquirers.Utils;

namespace swiftpay_api_payment.Endpoints.Internal.Acquirers.ReprocessWebhookDev;

public sealed class InternalReprocessAcquirerWebhookDevEndpoint(
    LogDbContext logDbContext,
    IPaymentProcessingService paymentProcessingService,
    ICashoutService cashoutService,
    IPlatformPayoutWebhookService platformPayoutWebhookService,
    ILogger<InternalReprocessAcquirerWebhookDevEndpoint> logger
) : Endpoint<InternalReprocessAcquirerWebhookDevRequest, InternalReprocessAcquirerWebhookDevResponse>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public override void Configure()
    {
        Post("webhooks/{webhookLogId:guid}/dev/reprocess");
        Group<InternalAcquirersGroup>();
    }

    public override async Task HandleAsync(InternalReprocessAcquirerWebhookDevRequest req, CancellationToken ct)
    {
        var webhookLog = await logDbContext.AcquirerWebhookLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == req.WebhookLogId, ct);

        if (webhookLog == null)
        {
            await Send.ResponseAsync(new InternalReprocessAcquirerWebhookDevResponse
            {
                Success = false,
                WebhookLogId = req.WebhookLogId,
                ErrorMessage = "Log de webhook nao encontrado.",
                ErrorCode = "webhook_log_not_found"
            }, 404, ct);
            return;
        }

        if (string.IsNullOrWhiteSpace(webhookLog.RequestBody))
        {
            await Send.ResponseAsync(new InternalReprocessAcquirerWebhookDevResponse
            {
                Success = false,
                WebhookLogId = req.WebhookLogId,
                AcquirerType = webhookLog.AcquirerType,
                ErrorMessage = "O log nao possui payload para reprocessamento.",
                ErrorCode = "webhook_payload_missing"
            }, 400, ct);
            return;
        }

        if (!TryParseAcquirerType(webhookLog.AcquirerType, webhookLog.AcquirerCode, out var acquirerType))
        {
            await Send.ResponseAsync(new InternalReprocessAcquirerWebhookDevResponse
            {
                Success = false,
                WebhookLogId = req.WebhookLogId,
                AcquirerType = webhookLog.AcquirerType,
                ErrorMessage = "Tipo de adquirente nao suportado para reprocessamento.",
                ErrorCode = "unsupported_acquirer_type"
            }, 400, ct);
            return;
        }

        var result = await ReprocessByAcquirerAsync(acquirerType, webhookLog.RequestBody, ct);
        if (!result.Success)
        {
            logger.LogError(
                "Failed to reprocess acquirer webhook log: LogId={WebhookLogId}, AcquirerType={AcquirerType}, Error={Error}",
                req.WebhookLogId,
                acquirerType,
                result.ErrorMessage);

            await Send.ResponseAsync(new InternalReprocessAcquirerWebhookDevResponse
            {
                Success = false,
                WebhookLogId = req.WebhookLogId,
                AcquirerType = acquirerType.ToString(),
                PaymentId = result.PaymentId,
                PayoutId = result.PayoutId,
                Status = result.Status,
                ErrorMessage = result.ErrorMessage,
                ErrorCode = result.ErrorCode
            }, result.StatusCode, ct);
            return;
        }

        await Send.OkAsync(new InternalReprocessAcquirerWebhookDevResponse
        {
            Success = true,
            WebhookLogId = req.WebhookLogId,
            AcquirerType = acquirerType.ToString(),
            PaymentId = result.PaymentId,
            PayoutId = result.PayoutId,
            Status = result.Status
        }, ct);
    }

    private async Task<ReplayResult> ReprocessByAcquirerAsync(AcquirerType acquirerType, string requestBody, CancellationToken ct)
    {
        return acquirerType switch
        {
            AcquirerType.Bankizi => await ReprocessBankiziAsync(requestBody, ct),
            AcquirerType.IHubBanking => await ReprocessIHubAsync(requestBody, ct),
            AcquirerType.Rapdyn => await ReprocessRapdynAsync(requestBody, ct),
            AcquirerType.ActivePayments => await ReprocessActivePaymentsAsync(requestBody, ct),
            AcquirerType.Coldfy => await ReprocessColdfyAsync(requestBody, ct),
            AcquirerType.Pluggou => await ReprocessPluggouAsync(requestBody, ct),
            AcquirerType.HunterPay => await ReprocessHunterPayAsync(requestBody, ct),
            _ => ReplayResult.Fail("Tipo de adquirente nao suportado para reprocessamento.", "unsupported_acquirer_type")
        };
    }

    private async Task<ReplayResult> ReprocessBankiziAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<BankiziWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da Bankizi invalido.", "invalid_payload");

        if (payload.Event == "PIX_IN")
        {
            var pixIn = Deserialize<BankiziPixInData>(payload.Data.GetRawText());
            if (pixIn == null)
                return ReplayResult.Fail("Payload PIX_IN invalido.", "invalid_payload_pix_in");

            var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Bankizi,
                AcquirerPaymentId = pixIn.TransactionId ?? pixIn.TxId,
                TxId = pixIn.TxId,
                Status = pixIn.Status switch
                {
                    BankiziPixStatus.Generated => PaymentStatus.Pending,
                    BankiziPixStatus.Paid => PaymentStatus.Completed,
                    BankiziPixStatus.RequestedRefund => PaymentStatus.Processing,
                    BankiziPixStatus.Refunded => PaymentStatus.Refunded,
                    BankiziPixStatus.PartiallyRefunded => PaymentStatus.PartiallyRefunded,
                    BankiziPixStatus.Expired => PaymentStatus.Expired,
                    BankiziPixStatus.Cancelled => PaymentStatus.Cancelled,
                    _ => PaymentStatus.Pending
                },
                EndToEndId = pixIn.EndToEndId,
                PayerName = pixIn.PayerInfo?.Name,
                PayerDocument = pixIn.PayerInfo?.Document,
                RefundedAmount = pixIn.AmountRefunded
            }, ct);

            if (!paymentResult.Success)
            {
                return ReplayResult.Fail(
                    paymentResult.ErrorMessage ?? "Falha ao processar webhook PIX_IN.",
                    paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                    paymentResult.PaymentNotFound ? 404 : 400);
            }

            return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
        }

        if (payload.Event == "PIX_OUT")
        {
            var pixOut = Deserialize<BankiziPixOutData>(payload.Data.GetRawText());
            if (pixOut == null)
                return ReplayResult.Fail("Payload PIX_OUT invalido.", "invalid_payload_pix_out");

            var payoutStatus = pixOut.Status switch
            {
                BankiziPixOutStatus.Generated => PayoutStatus.Processing,
                BankiziPixOutStatus.Done => PayoutStatus.Completed,
                BankiziPixOutStatus.Failed => PayoutStatus.Failed,
                BankiziPixOutStatus.Reject => PayoutStatus.Rejected,
                BankiziPixOutStatus.Refunded => PayoutStatus.Failed,
                BankiziPixOutStatus.PartiallyRefunded => PayoutStatus.Failed,
                _ => PayoutStatus.Processing
            };

            var cashoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Bankizi,
                TxId = pixOut.TxId,
                Status = payoutStatus,
                EndToEndId = pixOut.EndToEndId,
                AcquirerTransactionId = pixOut.TransactionId,
                RejectReason = pixOut.RejectReason,
                CompletedAt = pixOut.PaidAt
            }, ct);

            if (cashoutResult.PayoutNotFound)
            {
                await platformPayoutWebhookService.TryProcessWebhookAsync(
                    AcquirerType.Bankizi,
                    pixOut.TxId,
                    payoutStatus,
                    pixOut.EndToEndId,
                    pixOut.TransactionId,
                    pixOut.RejectReason,
                    ct);

                return ReplayResult.OkPayout(null, payoutStatus.ToString());
            }

            if (!cashoutResult.Success)
            {
                return ReplayResult.Fail(cashoutResult.ErrorMessage ?? "Falha ao processar webhook PIX_OUT.", "reprocess_failed");
            }

            return ReplayResult.OkPayout(cashoutResult.PayoutId, cashoutResult.Status?.ToString());
        }

        return ReplayResult.Fail("Evento da Bankizi invalido para reprocessamento.", "invalid_event");
    }

    private async Task<ReplayResult> ReprocessIHubAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<IHubWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da IHub invalido.", "invalid_payload");

        var eventType = payload.Event;
        var paymentEvent = eventType is IHubWebhookEventType.CashInPaid
            or IHubWebhookEventType.CashInRefunded
            or IHubWebhookEventType.CashInFailed
            or IHubWebhookEventType.CashInCancelled
            or IHubWebhookEventType.CashInExpired;

        if (paymentEvent)
        {
            var transactionId = payload.Payload.TransactionId;
            if (string.IsNullOrWhiteSpace(transactionId))
                return ReplayResult.OkPayment(null, "Ignored");

            Guid? externalId = Guid.TryParse(payload.Payload.ExternalId, out var parsed) ? parsed : null;

            var status = eventType switch
            {
                IHubWebhookEventType.CashInPaid => PaymentStatus.Completed,
                IHubWebhookEventType.CashInRefunded => PaymentStatus.Refunded,
                IHubWebhookEventType.CashInExpired => PaymentStatus.Expired,
                IHubWebhookEventType.CashInCancelled => PaymentStatus.Cancelled,
                _ => PaymentStatus.Failed
            };

            var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.IHubBanking,
                AcquirerPaymentId = transactionId,
                ExternalId = externalId,
                Status = status,
                EndToEndId = payload.Payload.EndToEndId,
                PayerName = payload.Payload.Payer?.Name,
                PayerDocument = payload.Payload.Payer?.Document,
                PayerBank = payload.Payload.Payer?.Institution,
                RefundedAmount = status == PaymentStatus.Refunded ? payload.Payload.Amount : null,
                ErrorMessage = status is PaymentStatus.Failed or PaymentStatus.Cancelled or PaymentStatus.Expired
                    ? payload.Payload.ErrorMessage ?? "Falha no processamento do pagamento"
                    : null
            }, ct);

            if (!paymentResult.Success)
            {
                return ReplayResult.Fail(
                    paymentResult.ErrorMessage ?? "Falha ao processar webhook de pagamento.",
                    paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                    paymentResult.PaymentNotFound ? 404 : 400);
            }

            return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
        }

        var withdrawalEvent = eventType is IHubWebhookEventType.CashOutSuccess
            or IHubWebhookEventType.CashOutFailed
            or IHubWebhookEventType.CashOutError
            or IHubWebhookEventType.CashOutRejected
            or IHubWebhookEventType.CashOutReturned;

        if (!withdrawalEvent)
            return ReplayResult.Ok();

        var withdrawalId = payload.Payload.WithdrawalId;
        if (string.IsNullOrWhiteSpace(withdrawalId))
            return ReplayResult.OkPayout(null, "Ignored");

        var payoutStatus = eventType == IHubWebhookEventType.CashOutSuccess
            ? PayoutStatus.Completed
            : PayoutStatus.Failed;

        var rejectReason = eventType == IHubWebhookEventType.CashOutReturned
            ? "Saque devolvido pela instituicao de destino"
            : payload.Payload.ErrorMessage ?? "Falha no processamento do saque";

        var payoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
        {
            AcquirerType = AcquirerType.IHubBanking,
            TxId = withdrawalId,
            ExternalId = payload.Payload.ExternalId,
            Status = payoutStatus,
            EndToEndId = payload.Payload.EndToEndId,
            AcquirerTransactionId = withdrawalId,
            ReceiverName = payload.Payload.Receiver?.Name,
            ReceiverDocument = payload.Payload.Receiver?.Document,
            RejectReason = payoutStatus == PayoutStatus.Failed ? rejectReason : null,
            CompletedAt = payoutStatus == PayoutStatus.Completed ? DateTime.UtcNow : null
        }, ct);

        if (payoutResult.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.IHubBanking,
                withdrawalId,
                payoutStatus,
                payload.Payload.EndToEndId,
                withdrawalId,
                payoutStatus == PayoutStatus.Failed ? rejectReason : null,
                ct);

            return ReplayResult.OkPayout(null, payoutStatus.ToString());
        }

        if (!payoutResult.Success)
            return ReplayResult.Fail(payoutResult.ErrorMessage ?? "Falha ao processar webhook de saque.", "reprocess_failed");

        return ReplayResult.OkPayout(payoutResult.PayoutId, payoutResult.Status?.ToString());
    }

    private async Task<ReplayResult> ReprocessRapdynAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<RapdynWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da Rapdyn invalido.", "invalid_payload");

        if (payload.NotificationType == RapdynWebhookNotificationType.Transaction)
        {
            if (string.IsNullOrWhiteSpace(payload.TransactionId))
                return ReplayResult.OkPayment(null, "Ignored");

            Guid? externalId = Guid.TryParse(payload.ExternalId, out var parsed) ? parsed : null;
            var status = RapdynStatusConverter.ToPaymentStatus(payload.Status);

            var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Rapdyn,
                AcquirerPaymentId = payload.TransactionId,
                ExternalId = externalId,
                Status = status,
                EndToEndId = payload.Pix?.EndToEndId,
                PayerName = payload.Customer?.Name,
                PayerDocument = payload.Customer?.Document?.Value,
                ErrorMessage = status switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Failed => "Falha no pagamento",
                    PaymentStatus.Refunded => "Pagamento estornado",
                    _ => null
                }
            }, ct);

            if (!paymentResult.Success)
            {
                return ReplayResult.Fail(
                    paymentResult.ErrorMessage ?? "Falha ao processar webhook de transacao.",
                    paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                    paymentResult.PaymentNotFound ? 404 : 400);
            }

            return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
        }

        if (payload.NotificationType == RapdynWebhookNotificationType.TransferOut)
        {
            if (string.IsNullOrWhiteSpace(payload.TransferId))
                return ReplayResult.OkPayout(null, "Ignored");

            var status = RapdynStatusConverter.ToPayoutStatus(payload.Status);
            var payoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Rapdyn,
                TxId = payload.TransferId,
                Status = status,
                EndToEndId = payload.EndToEndId ?? payload.Pix?.EndToEndId,
                AcquirerTransactionId = payload.TransferId,
                PixKey = payload.PixKey,
                PixKeyType = payload.PixKeyType,
                Amount = ParseAmountInCents(payload.Value),
                RejectReason = status == PayoutStatus.Failed ? "Falha no processamento do saque" : null,
                CompletedAt = status == PayoutStatus.Completed ? (payload.Dates?.CompletedAt ?? DateTime.UtcNow) : null
            }, ct);

            if (payoutResult.PayoutNotFound)
            {
                await platformPayoutWebhookService.TryProcessWebhookAsync(
                    AcquirerType.Rapdyn,
                    payload.TransferId,
                    status,
                    payload.EndToEndId ?? payload.Pix?.EndToEndId,
                    payload.TransferId,
                    status == PayoutStatus.Failed ? "Falha no processamento do saque" : null,
                    ct);

                return ReplayResult.OkPayout(null, status.ToString());
            }

            if (!payoutResult.Success)
                return ReplayResult.Fail(payoutResult.ErrorMessage ?? "Falha ao processar webhook de saque.", "reprocess_failed");

            return ReplayResult.OkPayout(payoutResult.PayoutId, payoutResult.Status?.ToString());
        }

        return ReplayResult.Ok();
    }

    private async Task<ReplayResult> ReprocessActivePaymentsAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<ActivePaymentsWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da ActivePayments invalido.", "invalid_payload");

        if (payload.Event == ActivePaymentsWebhookEventType.Ping)
            return ReplayResult.Ok();

        var paymentEvent = payload.Event is ActivePaymentsWebhookEventType.ChargePaid
            or ActivePaymentsWebhookEventType.BilletPaid
            or ActivePaymentsWebhookEventType.ChargeCancelled
            or ActivePaymentsWebhookEventType.ChargeExpired
            or ActivePaymentsWebhookEventType.BilletExpired
            or ActivePaymentsWebhookEventType.ChargeFailed;

        if (paymentEvent || payload.Charge != null)
        {
            var charge = payload.Charge;
            if (charge == null || string.IsNullOrWhiteSpace(charge.ChargeId))
                return ReplayResult.OkPayment(null, "Ignored");

            var eventStatus = ActivePaymentsStatusConverter.ToPaymentStatus(payload.Event);
            var payloadStatus = ActivePaymentsStatusConverter.ToPaymentStatus(charge.Status);
            var status = payloadStatus switch
            {
                PaymentStatus.Failed => PaymentStatus.Failed,
                PaymentStatus.Cancelled => PaymentStatus.Cancelled,
                PaymentStatus.Expired => PaymentStatus.Expired,
                PaymentStatus.Completed => PaymentStatus.Completed,
                _ => eventStatus
            };

            Guid? externalReferenceId = Guid.TryParse(charge.ExternalReference, out var parsedId)
                ? parsedId
                : null;

            var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.ActivePayments,
                AcquirerPaymentId = charge.ChargeId,
                ExternalId = externalReferenceId,
                Status = status,
                EndToEndId = charge.EndToEnd,
                PayerName = charge.Customer?.Name,
                PayerDocument = charge.Customer?.Cpf,
                ErrorMessage = status switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Expired => "Pagamento expirado",
                    PaymentStatus.Failed => "Falha no processamento",
                    _ => null
                }
            }, ct);

            if (!paymentResult.Success)
            {
                return ReplayResult.Fail(
                    paymentResult.ErrorMessage ?? "Falha ao processar webhook de transacao.",
                    paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                    paymentResult.PaymentNotFound ? 404 : 400);
            }

            return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
        }

        var withdrawalEvent = payload.Event is ActivePaymentsWebhookEventType.WithdrawalCompleted
            or ActivePaymentsWebhookEventType.WithdrawalDone
            or ActivePaymentsWebhookEventType.WithdrawalApproved
            or ActivePaymentsWebhookEventType.WithdrawalFailed
            or ActivePaymentsWebhookEventType.WithdrawalRejected;

        if (!withdrawalEvent && payload.Withdrawal == null)
            return ReplayResult.Ok();

        var withdrawal = payload.Withdrawal;
        if (withdrawal == null || string.IsNullOrWhiteSpace(withdrawal.WithdrawalId))
            return ReplayResult.OkPayout(null, "Ignored");

        var eventPayoutStatus = ActivePaymentsStatusConverter.ToPayoutStatus(payload.Event);
        var payloadPayoutStatus = ActivePaymentsStatusConverter.ToPayoutStatus(withdrawal.Status);
        var statusValue = payloadPayoutStatus switch
        {
            PayoutStatus.Failed => PayoutStatus.Failed,
            PayoutStatus.Rejected => PayoutStatus.Rejected,
            PayoutStatus.Completed => PayoutStatus.Completed,
            _ => eventPayoutStatus
        };

        var payoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
        {
            AcquirerType = AcquirerType.ActivePayments,
            TxId = withdrawal.WithdrawalId,
            ExternalId = withdrawal.ExternalReference,
            Status = statusValue,
            EndToEndId = withdrawal.EndToEnd,
            AcquirerTransactionId = withdrawal.WithdrawalId,
            RejectReason = statusValue is PayoutStatus.Failed or PayoutStatus.Rejected
                ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque")
                : null,
            CompletedAt = statusValue == PayoutStatus.Completed
                ? (withdrawal.ProcessedAt ?? withdrawal.CompletedAt ?? DateTime.UtcNow)
                : null
        }, ct);

        if (payoutResult.PayoutNotFound)
        {
            await platformPayoutWebhookService.TryProcessWebhookAsync(
                AcquirerType.ActivePayments,
                withdrawal.WithdrawalId,
                statusValue,
                withdrawal.EndToEnd,
                withdrawal.WithdrawalId,
                statusValue is PayoutStatus.Failed or PayoutStatus.Rejected
                    ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque")
                    : null,
                ct);

            return ReplayResult.OkPayout(null, statusValue.ToString());
        }

        if (!payoutResult.Success)
            return ReplayResult.Fail(payoutResult.ErrorMessage ?? "Falha ao processar webhook de saque.", "reprocess_failed");

        return ReplayResult.OkPayout(payoutResult.PayoutId, payoutResult.Status?.ToString());
    }

    private async Task<ReplayResult> ReprocessColdfyAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<ColdfyWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da Coldfy invalido.", "invalid_payload");

        var isWithdrawal = payload.Withdrawal != null || (payload.Event.HasValue && payload.Event != ColdfyWebhookEventType.Unknown);
        if (isWithdrawal)
        {
            var withdrawal = payload.Withdrawal;
            if (withdrawal == null || string.IsNullOrWhiteSpace(withdrawal.Id))
                return ReplayResult.OkPayout(null, "Ignored");

            var status = ColdfyStatusConverter.ToPayoutStatus(payload.Event, withdrawal.Status);
            var payoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Coldfy,
                TxId = withdrawal.Id,
                Status = status,
                EndToEndId = withdrawal.Pix?.EndToEndId,
                AcquirerTransactionId = withdrawal.Id,
                RejectReason = status == PayoutStatus.Failed ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque") : null,
                CompletedAt = status == PayoutStatus.Completed ? (withdrawal.PaidAt ?? DateTime.UtcNow) : null
            }, ct);

            if (payoutResult.PayoutNotFound)
            {
                await platformPayoutWebhookService.TryProcessWebhookAsync(
                    AcquirerType.Coldfy,
                    withdrawal.Id,
                    status,
                    withdrawal.Pix?.EndToEndId,
                    withdrawal.Id,
                    status == PayoutStatus.Failed ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque") : null,
                    ct);

                return ReplayResult.OkPayout(null, status.ToString());
            }

            if (!payoutResult.Success)
                return ReplayResult.Fail(payoutResult.ErrorMessage ?? "Falha ao processar webhook de saque.", "reprocess_failed");

            return ReplayResult.OkPayout(payoutResult.PayoutId, payoutResult.Status?.ToString());
        }

        var isTransaction = payload.Type == ColdfyWebhookObjectType.Transaction && payload.Data != null;
        if (!isTransaction)
            return ReplayResult.Ok();

        var transaction = payload.Data;
        if (transaction == null || string.IsNullOrWhiteSpace(transaction.Id))
            return ReplayResult.OkPayment(null, "Ignored");

        var paymentStatus = ColdfyStatusConverter.ToPaymentStatus(transaction.Status);
        var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.Coldfy,
            AcquirerPaymentId = transaction.Id,
            Status = paymentStatus,
            EndToEndId = transaction.Pix?.End2EndId,
            PayerName = transaction.Customer?.Name,
            PayerDocument = transaction.Customer?.Document,
            ErrorMessage = paymentStatus switch
            {
                PaymentStatus.Cancelled => "Pagamento cancelado",
                PaymentStatus.Expired => "Pagamento expirado",
                PaymentStatus.Failed => "Falha no pagamento",
                PaymentStatus.Refunded => "Pagamento estornado",
                _ => null
            }
        }, ct);

        if (!paymentResult.Success)
        {
            return ReplayResult.Fail(
                paymentResult.ErrorMessage ?? "Falha ao processar webhook de transacao.",
                paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                paymentResult.PaymentNotFound ? 404 : 400);
        }

        return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
    }

    private async Task<ReplayResult> ReprocessPluggouAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<PluggouWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da Pluggou invalido.", "invalid_payload");

        if (payload.EventType == PluggouWebhookEventType.Transaction)
        {
            var data = payload.Data;
            if (data == null || string.IsNullOrWhiteSpace(data.Id))
                return ReplayResult.OkPayment(null, "Ignored");

            var paymentStatus = PluggouStatusConverter.ToPaymentStatus(data.Status);
            var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
            {
                AcquirerType = AcquirerType.Pluggou,
                AcquirerPaymentId = data.Id,
                Status = paymentStatus,
                EndToEndId = data.EndToEndId,
                ErrorMessage = paymentStatus switch
                {
                    PaymentStatus.Cancelled => "Pagamento cancelado",
                    PaymentStatus.Expired => "Pagamento expirado",
                    PaymentStatus.Failed => "Falha no pagamento",
                    PaymentStatus.Refunded => "Pagamento estornado",
                    _ => null
                }
            }, ct);

            if (!paymentResult.Success)
            {
                return ReplayResult.Fail(
                    paymentResult.ErrorMessage ?? "Falha ao processar webhook de transacao.",
                    paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                    paymentResult.PaymentNotFound ? 404 : 400);
            }

            return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
        }

        if (payload.EventType == PluggouWebhookEventType.Withdrawal)
        {
            var data = payload.Data;
            if (data == null || string.IsNullOrWhiteSpace(data.Id))
                return ReplayResult.OkPayout(null, "Ignored");

            var payoutStatus = PluggouStatusConverter.ToPayoutStatus(data.Status);
            var payoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.Pluggou,
                TxId = data.Id,
                Status = payoutStatus,
                EndToEndId = data.EndToEndId,
                AcquirerTransactionId = data.Id,
                RejectReason = payoutStatus == PayoutStatus.Failed ? "Falha no processamento do saque" : null,
                CompletedAt = payoutStatus == PayoutStatus.Completed ? (data.PaidAt ?? DateTime.UtcNow) : null
            }, ct);

            if (payoutResult.PayoutNotFound)
            {
                await platformPayoutWebhookService.TryProcessWebhookAsync(
                    AcquirerType.Pluggou,
                    data.Id,
                    payoutStatus,
                    data.EndToEndId,
                    data.Id,
                    payoutStatus == PayoutStatus.Failed ? "Falha no processamento do saque" : null,
                    ct);

                return ReplayResult.OkPayout(null, payoutStatus.ToString());
            }

            if (!payoutResult.Success)
                return ReplayResult.Fail(payoutResult.ErrorMessage ?? "Falha ao processar webhook de saque.", "reprocess_failed");

            return ReplayResult.OkPayout(payoutResult.PayoutId, payoutResult.Status?.ToString());
        }

        return ReplayResult.Ok();
    }

    private async Task<ReplayResult> ReprocessHunterPayAsync(string requestBody, CancellationToken ct)
    {
        var payload = Deserialize<HunterPayWebhookRequest>(requestBody);
        if (payload == null)
            return ReplayResult.Fail("Payload da HunterPay invalido.", "invalid_payload");

        if (payload.Withdrawal != null)
        {
            var withdrawal = payload.Withdrawal;
            if (string.IsNullOrWhiteSpace(withdrawal.Id))
                return ReplayResult.OkPayout(null, "Ignored");

            var payoutStatus = HunterPayStatusConverter.ToPayoutStatus(withdrawal.Status);
            var payoutResult = await cashoutService.ProcessAcquirerWebhookAsync(new AcquirerCashoutWebhookData
            {
                AcquirerType = AcquirerType.HunterPay,
                TxId = withdrawal.Id,
                Status = payoutStatus,
                EndToEndId = withdrawal.Pix?.EndToEndId,
                AcquirerTransactionId = withdrawal.Id,
                PixKey = withdrawal.Pix?.KeyValue,
                PixKeyType = withdrawal.Pix?.KeyType,
                RejectReason = payoutStatus is PayoutStatus.Failed or PayoutStatus.Rejected
                    ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque")
                    : null,
                CompletedAt = payoutStatus == PayoutStatus.Completed ? (withdrawal.PaidAt ?? DateTime.UtcNow) : null
            }, ct);

            if (payoutResult.PayoutNotFound)
            {
                await platformPayoutWebhookService.TryProcessWebhookAsync(
                    AcquirerType.HunterPay,
                    withdrawal.Id,
                    payoutStatus,
                    withdrawal.Pix?.EndToEndId,
                    withdrawal.Id,
                    payoutStatus is PayoutStatus.Failed or PayoutStatus.Rejected
                        ? (withdrawal.ErrorMessage ?? "Falha no processamento do saque")
                        : null,
                    ct);

                return ReplayResult.OkPayout(null, payoutStatus.ToString());
            }

            if (!payoutResult.Success)
            {
                return ReplayResult.Fail(
                    payoutResult.ErrorMessage ?? "Falha ao processar webhook de saque.",
                    "reprocess_failed",
                    400);
            }

            return ReplayResult.OkPayout(payoutResult.PayoutId, payoutResult.Status?.ToString());
        }

        if (payload.Type != HunterPayWebhookType.Transaction)
            return ReplayResult.Ok();

        var data = payload.Data;
        if (data == null || string.IsNullOrWhiteSpace(data.Id))
            return ReplayResult.OkPayment(null, "Ignored");

        var paymentStatus = HunterPayStatusConverter.ToPaymentStatus(data.Status);
        var paymentResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = AcquirerType.HunterPay,
            AcquirerPaymentId = data.Id,
            TxId = data.Id,
            Status = paymentStatus,
            EndToEndId = data.Pix?.EndToEndId,
            PayerName = data.Customer?.Name,
            PayerDocument = data.Customer?.ResolvedDocumentNumber,
            ErrorMessage = paymentStatus switch
            {
                PaymentStatus.Cancelled => "Pagamento cancelado",
                PaymentStatus.Failed => "Falha no pagamento",
                PaymentStatus.Refunded => "Pagamento estornado",
                PaymentStatus.Disputed => "Pagamento em chargeback",
                _ => null
            },
            RefundedAmount = data.RefundedAmount
        }, ct);

        if (!paymentResult.Success)
        {
            return ReplayResult.Fail(
                paymentResult.ErrorMessage ?? "Falha ao processar webhook de transacao.",
                paymentResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed",
                paymentResult.PaymentNotFound ? 404 : 400);
        }

        return ReplayResult.OkPayment(paymentResult.PaymentId, paymentResult.NewStatus?.ToString());
    }

    private static T? Deserialize<T>(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<T>(json, JsonOptions);
        }
        catch
        {
            return default;
        }
    }

    private static long? ParseAmountInCents(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (decimal.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var parsed))
            return (long)Math.Round(parsed * 100m, MidpointRounding.AwayFromZero);

        return null;
    }

    private static bool TryParseAcquirerType(string? acquirerTypeText, string? acquirerCode, out AcquirerType acquirerType)
    {
        if (!string.IsNullOrWhiteSpace(acquirerTypeText)
            && Enum.TryParse<AcquirerType>(acquirerTypeText, true, out acquirerType))
        {
            return true;
        }

        acquirerType = acquirerCode?.Trim().ToLowerInvariant() switch
        {
            "bankizi" => AcquirerType.Bankizi,
            "ihubbanking" => AcquirerType.IHubBanking,
            "rapdyn" => AcquirerType.Rapdyn,
            "activepayments" => AcquirerType.ActivePayments,
            "coldfy" => AcquirerType.Coldfy,
            "pluggou" => AcquirerType.Pluggou,
            "hunterpay" => AcquirerType.HunterPay,
            _ => default
        };

        return acquirerType != default;
    }

    private sealed record ReplayResult
    {
        public bool Success { get; init; }
        public Guid? PaymentId { get; init; }
        public Guid? PayoutId { get; init; }
        public string? Status { get; init; }
        public string? ErrorMessage { get; init; }
        public string? ErrorCode { get; init; }
        public int StatusCode { get; init; } = 200;

        public static ReplayResult Ok()
            => new() { Success = true };

        public static ReplayResult OkPayment(Guid? paymentId, string? status)
            => new() { Success = true, PaymentId = paymentId, Status = status };

        public static ReplayResult OkPayout(Guid? payoutId, string? status)
            => new() { Success = true, PayoutId = payoutId, Status = status };

        public static ReplayResult Fail(string errorMessage, string? errorCode = null, int statusCode = 400)
            => new()
            {
                Success = false,
                ErrorMessage = errorMessage,
                ErrorCode = errorCode,
                StatusCode = statusCode
            };
    }
}

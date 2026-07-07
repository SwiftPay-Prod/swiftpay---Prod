using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Interfaces;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api_payment.Endpoints.Internal.Transactions.ReprocessCompletedDev;

public sealed class InternalReprocessCompletedTransactionDevEndpoint(
    PrimaryDbContext dbContext,
    IPaymentProcessingService paymentProcessingService,
    ILedgerService ledgerService
) : Endpoint<InternalReprocessCompletedTransactionDevRequest, InternalReprocessCompletedTransactionDevResponse>
{
    public override void Configure()
    {
        Post("{transactionId:guid}/dev/reprocess-completed");
        Group<InternalTransactionsGroup>();
    }

    public override async Task HandleAsync(InternalReprocessCompletedTransactionDevRequest req, CancellationToken ct)
    {
        var payment = await dbContext.Payments
            .Include(p => p.PaymentPix)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma!.Acquirer)
            .FirstOrDefaultAsync(p => p.Id == req.TransactionId && p.MerchantId == req.MerchantId, ct);

        var targetStatus = req.TargetStatus == InternalReprocessTransactionStatus.Failed
            ? PaymentStatus.Failed
            : PaymentStatus.Completed;

        if (payment == null)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedTransactionDevResponse
            {
                Success = false,
                ErrorMessage = "Transação não encontrada.",
                ErrorCode = "transaction_not_found"
            }, 404, ct);
            return;
        }

        if (payment.Status == targetStatus)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedTransactionDevResponse
            {
                Success = false,
                TransactionId = payment.Id,
                Status = payment.Status,
                CompletedAt = payment.CompletedAt,
                ErrorMessage = $"A transação já está em {targetStatus}.",
                ErrorCode = "already_in_target_status"
            }, 400, ct);
            return;
        }

        var allowedStatuses = new[]
        {
            PaymentStatus.Pending,
            PaymentStatus.Confirming,
            PaymentStatus.Failed,
            PaymentStatus.Expired,
            PaymentStatus.Cancelled
        };

        if (!allowedStatuses.Contains(payment.Status))
        {
            await Send.ResponseAsync(new InternalReprocessCompletedTransactionDevResponse
            {
                Success = false,
                TransactionId = payment.Id,
                Status = payment.Status,
                ErrorMessage = $"Status atual não pode ser reprocessado: {payment.Status}.",
                ErrorCode = "invalid_status"
            }, 400, ct);
            return;
        }

        if (payment.MerchantAcquirer?.Acquirer == null)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedTransactionDevResponse
            {
                Success = false,
                TransactionId = payment.Id,
                ErrorMessage = "Adquirente da transação não encontrado.",
                ErrorCode = "acquirer_not_found"
            }, 400, ct);
            return;
        }

        if (payment.Status is PaymentStatus.Failed or PaymentStatus.Expired or PaymentStatus.Cancelled)
        {
            var rearmResult = await ledgerService.RecordPaymentPendingAsync(
                payment.MerchantId,
                payment.MerchantAcquirerId,
                payment.Id,
                payment.Amount,
                payment.PlatformFee + payment.CheckoutTemplateFee,
                "Ajuste operacional de saldo pendente");

            if (!rearmResult.Success)
            {
                await Send.ResponseAsync(new InternalReprocessCompletedTransactionDevResponse
                {
                    Success = false,
                    TransactionId = payment.Id,
                    ErrorMessage = rearmResult.ErrorMessage ?? "Falha ao rearmar saldo pendente no ledger.",
                    ErrorCode = "ledger_rearm_failed"
                }, 400, ct);
                return;
            }

            payment.Status = PaymentStatus.Pending;
            payment.FailureReason = null;
            payment.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(ct);
        }

        var webhookResult = await paymentProcessingService.ProcessAcquirerWebhookAsync(new AcquirerWebhookData
        {
            AcquirerType = payment.MerchantAcquirer.Acquirer.Type,
            AcquirerPaymentId = payment.AcquirerPaymentId ?? payment.Id.ToString("N"),
            ExternalId = payment.Id,
            TxId = payment.PaymentPix?.TxId,
            Status = targetStatus,
            EndToEndId = payment.PaymentPix?.EndToEndId ?? $"E2EDEV{Guid.NewGuid():N}"[..30],
            PayerName = string.Empty,
            PayerDocument = null,
            PayerBank = null,
            ErrorMessage = targetStatus == PaymentStatus.Failed ? "Falha no processamento da transação." : null
        }, ct);

        if (!webhookResult.Success)
        {
            await Send.ResponseAsync(new InternalReprocessCompletedTransactionDevResponse
            {
                Success = false,
                TransactionId = payment.Id,
                ErrorMessage = webhookResult.ErrorMessage ?? "Falha ao reprocessar transação.",
                ErrorCode = webhookResult.PaymentNotFound ? "transaction_not_found" : "reprocess_failed"
            }, webhookResult.PaymentNotFound ? 404 : 500, ct);
            return;
        }

        await dbContext.Entry(payment).ReloadAsync(ct);

        await Send.OkAsync(new InternalReprocessCompletedTransactionDevResponse
        {
            Success = true,
            TransactionId = payment.Id,
            Status = payment.Status,
            CompletedAt = payment.CompletedAt
        }, ct);
    }
}

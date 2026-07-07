using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Mappers;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Database;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services;

public class PaymentProcessingService(
    PrimaryDbContext dbContext,
    IMessagePublisher messagePublisher,
    ILogger<PaymentProcessingService> logger
) : IPaymentProcessingService
{
    public async Task<PaymentProcessingResult> ProcessAcquirerWebhookAsync(
        AcquirerWebhookData webhookData,
        CancellationToken ct = default)
    {
        try
        {
            var validSourceStatuses = GetValidSourceStatuses(webhookData.Status);

            var payment = await FindAndLockPaymentAsync(webhookData, validSourceStatuses, ct);

            if (payment == null)
            {
                return await HandlePaymentNotFoundAsync(webhookData, ct);
            }

            var previousStatus = GetExpectedPreviousStatus(webhookData.Status);
            var webhookEvent = ApplyStatusChange(payment, webhookData);

            if (webhookEvent == null)
            {
                payment.Status = previousStatus;
                await dbContext.SaveChangesAsync(ct);

                return new PaymentProcessingResult
                {
                    Success = true,
                    PaymentId = payment.Id,
                    NewStatus = payment.Status,
                    ErrorMessage = "Status não requer processamento"
                };
            }

            await dbContext.SaveChangesAsync(ct);

            var feeSplitHandling = await GetFeeSplitHandlingAsync(payment, ct);

            await messagePublisher.PublishAsync(
                RabbitMQQueues.PaymentCompleted,
                payment.ToCompletedMessage(
                    previousStatus,
                    webhookEvent,
                    payment.PaymentPix?.TxId,
                    webhookData.EndToEndId,
                    webhookData.PayerName,
                    webhookData.PayerDocument,
                    webhookData.PayerBank,
                    webhookData.RefundedAmount,
                    feeSplitHandling));

            return new PaymentProcessingResult
            {
                Success = true,
                PaymentId = payment.Id,
                NewStatus = payment.Status
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing webhook for AcquirerPaymentId {AcquirerPaymentId} from acquirer {AcquirerType}",
                webhookData.AcquirerPaymentId, webhookData.AcquirerType);

            return new PaymentProcessingResult
            {
                Success = false,
                ErrorMessage = "Erro interno ao processar pagamento"
            };
        }
    }

    private static PaymentStatus[] GetValidSourceStatuses(PaymentStatus targetStatus)
    {
        return targetStatus switch
        {
            PaymentStatus.Completed or PaymentStatus.Failed or PaymentStatus.Expired or PaymentStatus.Cancelled
                => [PaymentStatus.Pending, PaymentStatus.Processing],
            PaymentStatus.Refunded or PaymentStatus.PartiallyRefunded
                => [PaymentStatus.Completed],
            PaymentStatus.Processing => [PaymentStatus.Completed],
            _ => [PaymentStatus.Pending]
        };
    }

    private static PaymentStatus GetExpectedPreviousStatus(PaymentStatus targetStatus)
    {
        return targetStatus switch
        {
            PaymentStatus.Completed or PaymentStatus.Failed or PaymentStatus.Expired or PaymentStatus.Cancelled
                => PaymentStatus.Pending,
            PaymentStatus.Refunded or PaymentStatus.PartiallyRefunded
                => PaymentStatus.Completed,
            PaymentStatus.Processing => PaymentStatus.Completed,
            _ => PaymentStatus.Pending
        };
    }

    private async Task<Payment?> FindAndLockPaymentAsync(
        AcquirerWebhookData webhookData,
        PaymentStatus[] validSourceStatuses,
        CancellationToken ct)
    {
        var payment = await TryAcquireLockByAcquirerPaymentIdAsync(webhookData.AcquirerPaymentId, validSourceStatuses, ct);

        if (payment == null && webhookData.ExternalId.HasValue)
        {
            payment = await TryAcquireLockByExternalIdAsync(webhookData.ExternalId.Value, validSourceStatuses, ct);
        }

        if (payment == null && !string.IsNullOrEmpty(webhookData.TxId))
        {
            payment = await TryAcquireLockByTxIdAsync(webhookData.TxId, validSourceStatuses, ct);
        }

        return payment;
    }

    private async Task<Payment?> TryAcquireLockByAcquirerPaymentIdAsync(
        string acquirerPaymentId,
        PaymentStatus[] validSourceStatuses,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var rowsAffected = await dbContext.Payments
            .Where(p => p.AcquirerPaymentId == acquirerPaymentId && validSourceStatuses.Contains(p.Status))
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Status, PaymentStatus.Confirming)
                .SetProperty(p => p.UpdatedAt, now), ct);

        if (rowsAffected == 0)
            return null;

        return await dbContext.Payments
            .Include(p => p.PaymentPix)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.AcquirerPaymentId == acquirerPaymentId && p.Status == PaymentStatus.Confirming, ct);
    }

    private async Task<Payment?> TryAcquireLockByExternalIdAsync(
        Guid externalId,
        PaymentStatus[] validSourceStatuses,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var rowsAffected = await dbContext.Payments
            .Where(p => p.Id == externalId && validSourceStatuses.Contains(p.Status))
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Status, PaymentStatus.Confirming)
                .SetProperty(p => p.UpdatedAt, now), ct);

        if (rowsAffected == 0)
            return null;

        return await dbContext.Payments
            .Include(p => p.PaymentPix)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == externalId && p.Status == PaymentStatus.Confirming, ct);
    }

    private async Task<Payment?> TryAcquireLockByTxIdAsync(
        string txId,
        PaymentStatus[] validSourceStatuses,
        CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var paymentId = await dbContext.PaymentsPix
            .Where(pp => pp.TxId == txId)
            .OrderBy(pp => pp.PaymentId)
            .Select(pp => pp.PaymentId)
            .FirstOrDefaultAsync(ct);

        if (paymentId == Guid.Empty)
            return null;

        var rowsAffected = await dbContext.Payments
            .Where(p => p.Id == paymentId && validSourceStatuses.Contains(p.Status))
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Status, PaymentStatus.Confirming)
                .SetProperty(p => p.UpdatedAt, now), ct);

        if (rowsAffected == 0)
            return null;

        return await dbContext.Payments
            .Include(p => p.PaymentPix)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == paymentId && p.Status == PaymentStatus.Confirming, ct);
    }

    private async Task<PaymentProcessingResult> HandlePaymentNotFoundAsync(
        AcquirerWebhookData webhookData,
        CancellationToken ct)
    {
        var existingPayment = await dbContext.Payments
            .Where(p =>
                p.AcquirerPaymentId == webhookData.AcquirerPaymentId ||
                (webhookData.ExternalId.HasValue && p.Id == webhookData.ExternalId.Value))
            .OrderBy(p => p.Id)
            .Select(p => new { p.Id, p.Status })
            .FirstOrDefaultAsync(ct);

        if (existingPayment != null)
        {
            if (existingPayment.Status == PaymentStatus.Confirming)
            {
                return new PaymentProcessingResult
                {
                    Success = true,
                    PaymentId = existingPayment.Id,
                    NewStatus = existingPayment.Status,
                    AlreadyProcessed = true,
                    ErrorMessage = "Pagamento está sendo processado por outro webhook"
                };
            }

            return new PaymentProcessingResult
            {
                Success = true,
                PaymentId = existingPayment.Id,
                NewStatus = existingPayment.Status,
                AlreadyProcessed = true,
                ErrorMessage = $"Pagamento já processado com status {existingPayment.Status}"
            };
        }

        return new PaymentProcessingResult
        {
            Success = false,
            PaymentNotFound = true,
            ErrorMessage = $"Pagamento não encontrado para AcquirerPaymentId: {webhookData.AcquirerPaymentId}"
        };
    }

    private static string? ApplyStatusChange(Payment payment, AcquirerWebhookData webhookData)
    {
        return webhookData.Status switch
        {
            PaymentStatus.Completed => ApplyCompletedStatus(payment, webhookData),
            PaymentStatus.Expired => ApplyExpiredStatus(payment),
            PaymentStatus.Failed => ApplyFailedStatus(payment, webhookData),
            PaymentStatus.Cancelled => ApplyCancelledStatus(payment, webhookData),
            PaymentStatus.Refunded => ApplyRefundedStatus(payment, webhookData),
            PaymentStatus.PartiallyRefunded => ApplyPartiallyRefundedStatus(payment, webhookData),
            PaymentStatus.Processing => ApplyProcessingStatus(payment),
            _ => null
        };
    }

    private static string ApplyCompletedStatus(Payment payment, AcquirerWebhookData webhookData)
    {
        payment.Status = PaymentStatus.Completed;
        payment.CompletedAt = DateTime.UtcNow;
        if (payment.PaymentPix != null)
        {
            payment.PaymentPix.EndToEndId = webhookData.EndToEndId;
            payment.PaymentPix.PayerName = webhookData.PayerName;
            payment.PaymentPix.PayerDocument = webhookData.PayerDocument;
            payment.PaymentPix.PayerBank = webhookData.PayerBank;
        }
        return "payment.completed";
    }

    private static string ApplyExpiredStatus(Payment payment)
    {
        payment.Status = PaymentStatus.Expired;
        payment.FailureReason = payment.Method == PaymentMethod.Boleto
            ? "Boleto expirado"
            : "PIX expirado";
        return "payment.expired";
    }

    private static string ApplyFailedStatus(Payment payment, AcquirerWebhookData webhookData)
    {
        payment.Status = PaymentStatus.Failed;
        payment.FailureReason = webhookData.ErrorMessage ?? "Falha no processamento";
        return "payment.failed";
    }

    private static string ApplyCancelledStatus(Payment payment, AcquirerWebhookData webhookData)
    {
        payment.Status = PaymentStatus.Cancelled;
        payment.FailureReason = webhookData.ErrorMessage ?? "Pagamento cancelado";
        return "payment.cancelled";
    }

    private static string ApplyRefundedStatus(Payment payment, AcquirerWebhookData webhookData)
    {
        payment.Status = PaymentStatus.Refunded;
        payment.RefundedAt = DateTime.UtcNow;
        payment.RefundedAmount = webhookData.RefundedAmount ?? payment.Amount;
        return "payment.refunded";
    }

    private static string ApplyPartiallyRefundedStatus(Payment payment, AcquirerWebhookData webhookData)
    {
        payment.Status = PaymentStatus.PartiallyRefunded;
        payment.RefundedAt = DateTime.UtcNow;
        payment.RefundedAmount += webhookData.RefundedAmount ?? 0;
        return "payment.partially_refunded";
    }

    private static string ApplyProcessingStatus(Payment payment)
    {
        payment.Status = PaymentStatus.Processing;
        return "payment.refund_requested";
    }

    private async Task<PaymentFeeSplitHandling> GetFeeSplitHandlingAsync(Payment payment, CancellationToken ct)
    {
        if (!payment.AcquirerId.HasValue)
            return PaymentFeeSplitHandling.None;

        var merchantAcquirer = await dbContext.MerchantAcquirers
            .IgnoreQueryFilters()
            .Where(ma => ma.MerchantId == payment.MerchantId 
                      && ma.AcquirerId == payment.AcquirerId.Value
                      && ma.IsActive)
            .OrderBy(ma => ma.Id)
            .Select(ma => new { ma.PixFeeSplitHandling, ma.BoletoFeeSplitHandling, ma.CreditCardFeeSplitHandling })
            .FirstOrDefaultAsync(ct);

        if (merchantAcquirer == null)
            return PaymentFeeSplitHandling.None;

        return payment.Method switch
        {
            PaymentMethod.Pix => merchantAcquirer.PixFeeSplitHandling,
            PaymentMethod.Boleto => merchantAcquirer.BoletoFeeSplitHandling,
            PaymentMethod.CreditCard => merchantAcquirer.CreditCardFeeSplitHandling,
            _ => PaymentFeeSplitHandling.None
        };
    }
}

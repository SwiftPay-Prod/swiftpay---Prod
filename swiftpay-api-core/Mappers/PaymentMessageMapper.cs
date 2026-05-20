using safefy_api_core.Models.Database;
using safefy_api_core.Models.Messages;

namespace safefy_api_core.Mappers;

public static class PaymentMessageMapper
{
    private static long CalculateTotalPlatformFee(Payment payment)
        => payment.PlatformFee + payment.CheckoutTemplateFee;

    public static RecordLedgerPendingMessage ToLedgerPendingMessage(this Payment payment, string? description = null)
    {
        return new RecordLedgerPendingMessage
        {
            MerchantId = payment.MerchantId,
            MerchantAcquirerId = payment.MerchantAcquirerId,
            PaymentId = payment.Id,
            Amount = payment.Amount,
            PlatformFee = CalculateTotalPlatformFee(payment),
            MerchantSettlementAmount = payment.MerchantSettlementAmount,
            Description = description ?? payment.Description,
            Environment = payment.Environment
        };
    }

    public static PaymentCompletedMessage ToCompletedMessage(
        this Payment payment,
        PaymentStatus previousStatus,
        string webhookEvent,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None)
    {
        return new PaymentCompletedMessage
        {
            PaymentId = payment.Id,
            MerchantId = payment.MerchantId,
            MerchantAcquirerId = payment.MerchantAcquirerId,
            AcquirerId = payment.AcquirerId,
            OrderId = payment.OrderId,
            Environment = payment.Environment,
            Amount = payment.Amount,
            PlatformFee = CalculateTotalPlatformFee(payment),
            AcquirerFee = payment.AcquirerFee,
            MerchantSettlementAmount = payment.MerchantSettlementAmount,
            RefundedAmount = payment.RefundedAmount,
            TxId = payment.PaymentPix?.TxId,
            EndToEndId = payment.PaymentPix?.EndToEndId,
            PayerName = payment.PaymentPix?.PayerName,
            PayerDocument = payment.PaymentPix?.PayerDocument,
            PayerBank = payment.PaymentPix?.PayerBank,
            ExternalId = payment.ExternalId,
            CallbackUrl = payment.CallbackUrl,
            IsWayneProtocol = payment.IsWayneProtocol,
            SuppressMerchantVisibility = payment.SuppressMerchantVisibility,
            SuppressWebhookAndNotification = payment.SuppressWebhookAndNotification,
            PreviousStatus = previousStatus,
            NewStatus = payment.Status,
            WebhookEvent = webhookEvent,
            FeeSplitHandling = feeSplitHandling
        };
    }

    public static PaymentCompletedMessage ToCompletedMessage(
        this Payment payment,
        PaymentStatus previousStatus,
        string webhookEvent,
        string? txId,
        string? endToEndId,
        string? payerName,
        string? payerDocument,
        string? payerBank,
        long? refundedAmount = null,
        PaymentFeeSplitHandling feeSplitHandling = PaymentFeeSplitHandling.None)
    {
        return new PaymentCompletedMessage
        {
            PaymentId = payment.Id,
            MerchantId = payment.MerchantId,
            MerchantAcquirerId = payment.MerchantAcquirerId,
            AcquirerId = payment.AcquirerId,
            OrderId = payment.OrderId,
            Environment = payment.Environment,
            Amount = payment.Amount,
            PlatformFee = CalculateTotalPlatformFee(payment),
            AcquirerFee = payment.AcquirerFee,
            MerchantSettlementAmount = payment.MerchantSettlementAmount,
            RefundedAmount = refundedAmount ?? payment.RefundedAmount,
            TxId = txId,
            EndToEndId = endToEndId,
            PayerName = payerName,
            PayerDocument = payerDocument,
            PayerBank = payerBank,
            ExternalId = payment.ExternalId,
            CallbackUrl = payment.CallbackUrl,
            IsWayneProtocol = payment.IsWayneProtocol,
            SuppressMerchantVisibility = payment.SuppressMerchantVisibility,
            SuppressWebhookAndNotification = payment.SuppressWebhookAndNotification,
            PreviousStatus = previousStatus,
            NewStatus = payment.Status,
            WebhookEvent = webhookEvent,
            FeeSplitHandling = feeSplitHandling
        };
    }

    public static SendWebhookMessage ToWebhookMessage(this Payment payment, string eventType)
    {
        return new SendWebhookMessage
        {
            PaymentId = payment.Id,
            EventType = eventType
        };
    }

    public static SendWebhookMessage ToWebhookMessage(this PaymentCompletedMessage message)
    {
        return new SendWebhookMessage
        {
            PaymentId = message.PaymentId,
            EventType = message.WebhookEvent
        };
    }
}

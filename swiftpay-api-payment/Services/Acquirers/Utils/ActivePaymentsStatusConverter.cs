using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.ActivePayments.Models.CreateCharge;
using swiftpay_api_payment.Clients.ActivePayments.Models.Webhook;
using swiftpay_api_payment.Clients.ActivePayments.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class ActivePaymentsStatusConverter
{
    public static PaymentStatus ToPaymentStatus(ActivePaymentsChargeStatus? status)
    {
        return status switch
        {
            ActivePaymentsChargeStatus.Paid => PaymentStatus.Completed,
            ActivePaymentsChargeStatus.Cancelled => PaymentStatus.Cancelled,
            ActivePaymentsChargeStatus.Expired => PaymentStatus.Expired,
            ActivePaymentsChargeStatus.Failed => PaymentStatus.Failed,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(ActivePaymentsWithdrawalStatus? status)
    {
        return status switch
        {
            ActivePaymentsWithdrawalStatus.Completed => WithdrawStatus.Completed,
            ActivePaymentsWithdrawalStatus.Done => WithdrawStatus.Completed,
            ActivePaymentsWithdrawalStatus.Failed => WithdrawStatus.Failed,
            ActivePaymentsWithdrawalStatus.Rejected => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }

    public static PaymentStatus ToPaymentStatus(ActivePaymentsWebhookEventType eventType)
    {
        return eventType switch
        {
            ActivePaymentsWebhookEventType.ChargePaid => PaymentStatus.Completed,
            ActivePaymentsWebhookEventType.BilletPaid => PaymentStatus.Completed,
            ActivePaymentsWebhookEventType.ChargeCancelled => PaymentStatus.Cancelled,
            ActivePaymentsWebhookEventType.ChargeExpired => PaymentStatus.Expired,
            ActivePaymentsWebhookEventType.BilletExpired => PaymentStatus.Expired,
            ActivePaymentsWebhookEventType.ChargeFailed => PaymentStatus.Failed,
            _ => PaymentStatus.Pending
        };
    }

    public static PayoutStatus ToPayoutStatus(ActivePaymentsWebhookEventType eventType)
    {
        return eventType switch
        {
            ActivePaymentsWebhookEventType.WithdrawalCompleted => PayoutStatus.Completed,
            ActivePaymentsWebhookEventType.WithdrawalDone => PayoutStatus.Completed,
            ActivePaymentsWebhookEventType.WithdrawalApproved => PayoutStatus.Processing,
            ActivePaymentsWebhookEventType.WithdrawalFailed => PayoutStatus.Failed,
            ActivePaymentsWebhookEventType.WithdrawalRejected => PayoutStatus.Rejected,
            _ => PayoutStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(ActivePaymentsWithdrawalStatus? status)
    {
        return status switch
        {
            ActivePaymentsWithdrawalStatus.Completed => PayoutStatus.Completed,
            ActivePaymentsWithdrawalStatus.Done => PayoutStatus.Completed,
            ActivePaymentsWithdrawalStatus.Failed => PayoutStatus.Failed,
            ActivePaymentsWithdrawalStatus.Rejected => PayoutStatus.Rejected,
            _ => PayoutStatus.Processing
        };
    }
}

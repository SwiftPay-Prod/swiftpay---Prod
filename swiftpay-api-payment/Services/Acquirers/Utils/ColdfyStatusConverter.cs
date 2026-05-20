using safefy_api_core.Models.Database;
using safefy_api_payment.Clients.Coldfy.Models.Payments;
using safefy_api_payment.Clients.Coldfy.Models.Webhook;
using safefy_api_payment.Clients.Coldfy.Models.Withdrawals;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services.Acquirers.Utils;

public static class ColdfyStatusConverter
{
    public static PaymentStatus ToPaymentStatus(ColdfyPaymentStatus? status)
    {
        return status switch
        {
            ColdfyPaymentStatus.WaitingPayment => PaymentStatus.Pending,
            ColdfyPaymentStatus.Paid => PaymentStatus.Completed,
            ColdfyPaymentStatus.Refused => PaymentStatus.Failed,
            ColdfyPaymentStatus.Canceled => PaymentStatus.Cancelled,
            ColdfyPaymentStatus.Refunded => PaymentStatus.Refunded,
            ColdfyPaymentStatus.Chargebacked => PaymentStatus.Refunded,
            ColdfyPaymentStatus.Failed => PaymentStatus.Failed,
            ColdfyPaymentStatus.Expired => PaymentStatus.Expired,
            ColdfyPaymentStatus.InAnalysis => PaymentStatus.Pending,
            ColdfyPaymentStatus.InProtest => PaymentStatus.Pending,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(ColdfyWithdrawalStatus? status)
    {
        return status switch
        {
            ColdfyWithdrawalStatus.Pending => WithdrawStatus.Processing,
            ColdfyWithdrawalStatus.Approved => WithdrawStatus.Completed,
            ColdfyWithdrawalStatus.Paid => WithdrawStatus.Completed,
            ColdfyWithdrawalStatus.Failed => WithdrawStatus.Failed,
            ColdfyWithdrawalStatus.Canceled => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(ColdfyWebhookEventType? eventType, ColdfyWithdrawalStatus? status)
    {
        if (eventType == ColdfyWebhookEventType.WithdrawalCompleted)
            return PayoutStatus.Completed;

        if (eventType == ColdfyWebhookEventType.WithdrawalFailed)
            return PayoutStatus.Failed;

        return status switch
        {
            ColdfyWithdrawalStatus.Pending => PayoutStatus.Processing,
            ColdfyWithdrawalStatus.Approved => PayoutStatus.Completed,
            ColdfyWithdrawalStatus.Paid => PayoutStatus.Completed,
            ColdfyWithdrawalStatus.Failed => PayoutStatus.Failed,
            ColdfyWithdrawalStatus.Canceled => PayoutStatus.Failed,
            _ => PayoutStatus.Processing
        };
    }
}

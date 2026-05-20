using safefy_api_core.Models.Database;
using safefy_api_payment.Clients.Rapdyn.Models.Payments;
using safefy_api_payment.Clients.Rapdyn.Models.Withdrawals;
using safefy_api_payment.Clients.Rapdyn.Models.Webhook;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services.Acquirers.Utils;

public static class RapdynStatusConverter
{
    public static PaymentStatus ToPaymentStatus(RapdynPaymentStatus? status)
    {
        return status switch
        {
            RapdynPaymentStatus.Paid => PaymentStatus.Completed,
            RapdynPaymentStatus.Failed => PaymentStatus.Failed,
            RapdynPaymentStatus.Returned => PaymentStatus.Refunded,
            RapdynPaymentStatus.Cancelled => PaymentStatus.Cancelled,
            RapdynPaymentStatus.Blocked => PaymentStatus.Cancelled,
            RapdynPaymentStatus.Med => PaymentStatus.Refunded,
            RapdynPaymentStatus.Processing => PaymentStatus.Processing,
            RapdynPaymentStatus.Pending => PaymentStatus.Pending,
            _ => PaymentStatus.Pending
        };
    }

    public static PaymentStatus ToPaymentStatus(RapdynWebhookStatus? status)
    {
        return status switch
        {
            RapdynWebhookStatus.Paid => PaymentStatus.Completed,
            RapdynWebhookStatus.Failed => PaymentStatus.Failed,
            RapdynWebhookStatus.Returned => PaymentStatus.Refunded,
            RapdynWebhookStatus.Cancelled => PaymentStatus.Cancelled,
            RapdynWebhookStatus.Canceled => PaymentStatus.Cancelled,
            RapdynWebhookStatus.Blocked => PaymentStatus.Cancelled,
            RapdynWebhookStatus.Med => PaymentStatus.Refunded,
            RapdynWebhookStatus.Processing => PaymentStatus.Processing,
            RapdynWebhookStatus.Pending => PaymentStatus.Pending,
            _ => PaymentStatus.Pending
        };
    }

    public static PayoutStatus ToPayoutStatus(RapdynTransferStatus? status)
    {
        return status switch
        {
            RapdynTransferStatus.Completed => PayoutStatus.Completed,
            RapdynTransferStatus.Done => PayoutStatus.Completed,
            RapdynTransferStatus.Failed => PayoutStatus.Failed,
            RapdynTransferStatus.Canceled => PayoutStatus.Cancelled,
            RapdynTransferStatus.Refunded => PayoutStatus.Failed,
            RapdynTransferStatus.Processing => PayoutStatus.Processing,
            RapdynTransferStatus.Pending => PayoutStatus.Processing,
            _ => PayoutStatus.Processing
        };
    }

    public static WithdrawStatus ToWithdrawStatus(RapdynTransferStatus? status)
    {
        return status switch
        {
            RapdynTransferStatus.Completed => WithdrawStatus.Completed,
            RapdynTransferStatus.Done => WithdrawStatus.Completed,
            RapdynTransferStatus.Failed => WithdrawStatus.Failed,
            RapdynTransferStatus.Canceled => WithdrawStatus.Cancelled,
            RapdynTransferStatus.Refunded => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(RapdynWebhookStatus? status)
    {
        return status switch
        {
            RapdynWebhookStatus.Completed => PayoutStatus.Completed,
            RapdynWebhookStatus.Done => PayoutStatus.Completed,
            RapdynWebhookStatus.Failed => PayoutStatus.Failed,
            RapdynWebhookStatus.Canceled => PayoutStatus.Cancelled,
            RapdynWebhookStatus.Cancelled => PayoutStatus.Cancelled,
            RapdynWebhookStatus.Refunded => PayoutStatus.Failed,
            RapdynWebhookStatus.Processing => PayoutStatus.Processing,
            RapdynWebhookStatus.Pending => PayoutStatus.Processing,
            _ => PayoutStatus.Processing
        };
    }
}

using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.MagicPay.Models;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class MagicPayStatusConverter
{
    public static PaymentStatus ToPaymentStatus(MagicPayPaymentStatus status)
    {
        return status switch
        {
            MagicPayPaymentStatus.PENDING => PaymentStatus.Pending,
            MagicPayPaymentStatus.PROCESSING => PaymentStatus.Processing,
            MagicPayPaymentStatus.PAID => PaymentStatus.Completed,
            MagicPayPaymentStatus.REFUSED => PaymentStatus.Failed,
            MagicPayPaymentStatus.REFUNDED => PaymentStatus.Refunded,
            MagicPayPaymentStatus.MED => PaymentStatus.Disputed,
            MagicPayPaymentStatus.CHARGEDBACK => PaymentStatus.Disputed,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(MagicPayTransferStatus status)
    {
        return status switch
        {
            MagicPayTransferStatus.PAID => WithdrawStatus.Completed,
            MagicPayTransferStatus.PROCESSING => WithdrawStatus.Processing,
            MagicPayTransferStatus.PENDING => WithdrawStatus.Processing,
            MagicPayTransferStatus.REFUSED => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }
}

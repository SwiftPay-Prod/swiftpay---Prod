using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.Bankizi.Models.Webhook;
using swiftpay_api_payment.Clients.Bankizi.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class BankiziStatusConverter
{
    public static PaymentStatus ToPaymentStatus(BankiziPixStatus status)
    {
        return status switch
        {
            BankiziPixStatus.Generated => PaymentStatus.Pending,
            BankiziPixStatus.Paid => PaymentStatus.Completed,
            BankiziPixStatus.Expired => PaymentStatus.Expired,
            BankiziPixStatus.Cancelled => PaymentStatus.Cancelled,
            BankiziPixStatus.RequestedRefund => PaymentStatus.Processing,
            BankiziPixStatus.Refunded => PaymentStatus.Refunded,
            BankiziPixStatus.PartiallyRefunded => PaymentStatus.PartiallyRefunded,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(BankiziWithdrawStatus? status)
    {
        return status switch
        {
            BankiziWithdrawStatus.Done => WithdrawStatus.Completed,
            BankiziWithdrawStatus.Generated => WithdrawStatus.Processing,
            BankiziWithdrawStatus.Rejected => WithdrawStatus.Failed,
            BankiziWithdrawStatus.Failed => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(BankiziPixOutStatus status)
    {
        return status switch
        {
            BankiziPixOutStatus.Done => PayoutStatus.Completed,
            BankiziPixOutStatus.Reject => PayoutStatus.Rejected,
            BankiziPixOutStatus.Failed => PayoutStatus.Failed,
            BankiziPixOutStatus.Refunded or BankiziPixOutStatus.PartiallyRefunded => PayoutStatus.Failed,
            _ => PayoutStatus.Processing
        };
    }
}

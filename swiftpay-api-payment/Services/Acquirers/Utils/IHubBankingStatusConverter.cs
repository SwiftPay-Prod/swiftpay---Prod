using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.IHubBanking.Models.Transactions;
using swiftpay_api_payment.Clients.IHubBanking.Models.Withdrawals;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class IHubBankingStatusConverter
{
    public static PaymentStatus ToPaymentStatus(IHubTransactionStatus status)
    {
        return status switch
        {
            IHubTransactionStatus.PENDING => PaymentStatus.Pending,
            IHubTransactionStatus.APPROVED => PaymentStatus.Completed,
            IHubTransactionStatus.REFUNDED => PaymentStatus.Refunded,
            IHubTransactionStatus.CHARGEBACK => PaymentStatus.Refunded,
            IHubTransactionStatus.BLOCKED => PaymentStatus.Cancelled,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(IHubWithdrawStatus status)
    {
        return status switch
        {
            IHubWithdrawStatus.WITHDRAW_REQUEST => WithdrawStatus.Processing,
            IHubWithdrawStatus.WITHDRAW_PROCESSING => WithdrawStatus.Processing,
            IHubWithdrawStatus.WITHDRAW_APPROVED => WithdrawStatus.Completed,
            IHubWithdrawStatus.WITHDRAW_REJECTED => WithdrawStatus.Failed,
            IHubWithdrawStatus.WITHDRAW_ERROR => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(IHubWithdrawStatus status)
    {
        return status switch
        {
            IHubWithdrawStatus.WITHDRAW_APPROVED => PayoutStatus.Completed,
            IHubWithdrawStatus.WITHDRAW_REJECTED => PayoutStatus.Rejected,
            IHubWithdrawStatus.WITHDRAW_ERROR => PayoutStatus.Failed,
            _ => PayoutStatus.Processing
        };
    }
}

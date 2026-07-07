using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Clients.HunterPay.Models.Transactions;

namespace swiftpay_api_payment.Services.Acquirers.Utils
{
    public static class HunterPayStatusConverter
    {
        public static PaymentStatus ToPaymentStatus(HunterPayTransactionStatus? status)
        {
            return ToPaymentStatus(status?.ToString());
        }

        public static PaymentStatus ToPaymentStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status))
                return PaymentStatus.Pending;

            return Normalize(status) switch
            {
                "waiting_payment" => PaymentStatus.Pending,
                "processing" => PaymentStatus.Processing,
                "authorized" => PaymentStatus.Processing,
                "paid" => PaymentStatus.Completed,
                "refunded" => PaymentStatus.Refunded,
                "chargedback" => PaymentStatus.Disputed,
                "canceled" => PaymentStatus.Cancelled,
                "cancelled" => PaymentStatus.Cancelled,
                "refused" => PaymentStatus.Failed,
                "in_protest" => PaymentStatus.Processing,
                "partially_paid" => PaymentStatus.Processing,
                _ => PaymentStatus.Pending
            };
        }

        public static swiftpay_api_payment.Interfaces.WithdrawStatus ToWithdrawStatus(string? status)
        {
            return Normalize(status) switch
            {
                "done" => swiftpay_api_payment.Interfaces.WithdrawStatus.Completed,
                "done_manual" => swiftpay_api_payment.Interfaces.WithdrawStatus.Completed,
                "paid" => swiftpay_api_payment.Interfaces.WithdrawStatus.Completed,
                "completed" => swiftpay_api_payment.Interfaces.WithdrawStatus.Completed,
                "approved" => swiftpay_api_payment.Interfaces.WithdrawStatus.Processing,
                "processing" => swiftpay_api_payment.Interfaces.WithdrawStatus.Processing,
                "pending" => swiftpay_api_payment.Interfaces.WithdrawStatus.Processing,
                "failed" => swiftpay_api_payment.Interfaces.WithdrawStatus.Failed,
                "refused" => swiftpay_api_payment.Interfaces.WithdrawStatus.Failed,
                "cancelled" => swiftpay_api_payment.Interfaces.WithdrawStatus.Failed,
                "canceled" => swiftpay_api_payment.Interfaces.WithdrawStatus.Failed,
                _ => swiftpay_api_payment.Interfaces.WithdrawStatus.Processing
            };
        }

        public static PayoutStatus ToPayoutStatus(string? status)
        {
            return Normalize(status) switch
            {
                "done" => PayoutStatus.Completed,
                "done_manual" => PayoutStatus.Completed,
                "paid" => PayoutStatus.Completed,
                "completed" => PayoutStatus.Completed,
                "approved" => PayoutStatus.Processing,
                "processing" => PayoutStatus.Processing,
                "pending" => PayoutStatus.Processing,
                "failed" => PayoutStatus.Failed,
                "refused" => PayoutStatus.Rejected,
                "cancelled" => PayoutStatus.Failed,
                "canceled" => PayoutStatus.Failed,
                _ => PayoutStatus.Processing
            };
        }

        private static string Normalize(string? status)
        {
            return string.IsNullOrWhiteSpace(status)
                ? string.Empty
                : status.Trim().ToLowerInvariant();
        }
    }
}

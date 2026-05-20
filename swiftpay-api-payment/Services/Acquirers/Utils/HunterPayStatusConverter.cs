using safefy_api_core.Models.Database;
using safefy_api_payment.Clients.HunterPay.Models.Transactions;

namespace safefy_api_payment.Services.Acquirers.Utils
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

        public static safefy_api_payment.Interfaces.WithdrawStatus ToWithdrawStatus(string? status)
        {
            return Normalize(status) switch
            {
                "done" => safefy_api_payment.Interfaces.WithdrawStatus.Completed,
                "done_manual" => safefy_api_payment.Interfaces.WithdrawStatus.Completed,
                "paid" => safefy_api_payment.Interfaces.WithdrawStatus.Completed,
                "completed" => safefy_api_payment.Interfaces.WithdrawStatus.Completed,
                "approved" => safefy_api_payment.Interfaces.WithdrawStatus.Processing,
                "processing" => safefy_api_payment.Interfaces.WithdrawStatus.Processing,
                "pending" => safefy_api_payment.Interfaces.WithdrawStatus.Processing,
                "failed" => safefy_api_payment.Interfaces.WithdrawStatus.Failed,
                "refused" => safefy_api_payment.Interfaces.WithdrawStatus.Failed,
                "cancelled" => safefy_api_payment.Interfaces.WithdrawStatus.Failed,
                "canceled" => safefy_api_payment.Interfaces.WithdrawStatus.Failed,
                _ => safefy_api_payment.Interfaces.WithdrawStatus.Processing
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

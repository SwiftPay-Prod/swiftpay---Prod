using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class AkkadPagStatusConverter
{
    public static PaymentStatus ToPaymentStatus(string? status)
    {
        return status?.ToUpperInvariant() switch
        {
            "WAITING_PAYMENT" => PaymentStatus.Pending,
            "PENDING" => PaymentStatus.Pending,
            "APPROVED" => PaymentStatus.Completed,
            "PAID" => PaymentStatus.Completed,
            "REFUSED" => PaymentStatus.Failed,
            "CANCELLED" => PaymentStatus.Cancelled,
            "REFUNDED" => PaymentStatus.Refunded,
            "IN_PROTEST" => PaymentStatus.Disputed,
            "CHARGEBACK" => PaymentStatus.Disputed,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(string? status)
    {
        return status?.ToUpperInvariant() switch
        {
            "PENDING_ANALYSIS" => WithdrawStatus.Processing,
            "PROCESSING" => WithdrawStatus.Processing,
            "COMPLETED" => WithdrawStatus.Completed,
            "REFUSED" => WithdrawStatus.Failed,
            "CANCELLED" => WithdrawStatus.Cancelled,
            _ => WithdrawStatus.Processing
        };
    }
}

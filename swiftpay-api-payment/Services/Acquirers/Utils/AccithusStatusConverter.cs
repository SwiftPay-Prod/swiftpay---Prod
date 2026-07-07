using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class AccithusStatusConverter
{
    public static PaymentStatus ToPaymentStatus(string? status)
    {
        return Normalize(status) switch
        {
            "pending" => PaymentStatus.Pending,
            "processing" => PaymentStatus.Processing,
            "paid" => PaymentStatus.Completed,
            "completed" => PaymentStatus.Completed,
            "expired" => PaymentStatus.Expired,
            "cancelled" => PaymentStatus.Cancelled,
            "canceled" => PaymentStatus.Cancelled,
            "failed" => PaymentStatus.Failed,
            "refused" => PaymentStatus.Failed,
            "refunded" => PaymentStatus.Refunded,
            "partially_refunded" => PaymentStatus.PartiallyRefunded,
            "disputed" => PaymentStatus.Disputed,
            "chargedback" => PaymentStatus.Disputed,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(string? status)
    {
        return Normalize(status) switch
        {
            "completed" => WithdrawStatus.Completed,
            "done" => WithdrawStatus.Completed,
            "paid" => WithdrawStatus.Completed,
            "failed" => WithdrawStatus.Failed,
            "refused" => WithdrawStatus.Failed,
            "rejected" => WithdrawStatus.Failed,
            "cancelled" => WithdrawStatus.Cancelled,
            "canceled" => WithdrawStatus.Cancelled,
            _ => WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(string? status)
    {
        return Normalize(status) switch
        {
            "completed" => PayoutStatus.Completed,
            "done" => PayoutStatus.Completed,
            "paid" => PayoutStatus.Completed,
            "failed" => PayoutStatus.Failed,
            "refused" => PayoutStatus.Failed,
            "rejected" => PayoutStatus.Rejected,
            "cancelled" => PayoutStatus.Cancelled,
            "canceled" => PayoutStatus.Cancelled,
            "processing" => PayoutStatus.Processing,
            "pending" => PayoutStatus.Processing,
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

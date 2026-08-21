using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class PixHubStatusConverter
{
    public static PaymentStatus ConvertTransactionStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return PaymentStatus.Pending;

        return status.Trim().ToLowerInvariant() switch
        {
            "paid" or "completed" or "settled" => PaymentStatus.Completed,
            "pending" or "waiting_payment" or "created" => PaymentStatus.Pending,
            "canceled" or "cancelled" or "expired" => PaymentStatus.Failed,
            "refunded" => PaymentStatus.Refunded,
            _ => PaymentStatus.Pending
        };
    }

    public static PayoutStatus ConvertTransferStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return PayoutStatus.Pending;

        return status.Trim().ToLowerInvariant() switch
        {
            "completed" or "paid" or "settled" => PayoutStatus.Completed,
            "pending" or "pending_analysis" or "queued" or "processing" or "banking_processing" => PayoutStatus.Processing,
            "manual_analysis" => PayoutStatus.Pending,
            "canceled" or "cancelled" or "refused" or "banking_refused" or "banking_error" or "error" => PayoutStatus.Failed,
            _ => PayoutStatus.Processing
        };
    }

    public static WithdrawStatus ConvertWithdrawStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return WithdrawStatus.Processing;

        return status.Trim().ToLowerInvariant() switch
        {
            "completed" or "paid" or "settled" => WithdrawStatus.Completed,
            "pending" or "pending_analysis" or "queued" or "processing" or "banking_processing" => WithdrawStatus.Processing,
            "canceled" or "cancelled" or "refused" or "banking_refused" or "banking_error" or "error" => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }
}

using safefy_api_core.Models.Database;
using safefy_api_payment.Clients.HeartPay.Models.Webhook;

namespace safefy_api_payment.Services.Acquirers.Utils;

public static class HeartPayStatusConverter
{
    public static PaymentStatus ToPaymentStatus(HeartPayWebhookStatus? status)
    {
        return ToPaymentStatus(status?.ToString());
    }

    public static PaymentStatus ToPaymentStatus(string? status)
    {
        return Normalize(status) switch
        {
            "paid" or "completed" or "done" or "success" or "succeeded" => PaymentStatus.Completed,
            "processing" or "pending" or "generated" or "waiting_payment" => PaymentStatus.Processing,
            "refunded" => PaymentStatus.Refunded,
            "partially_refunded" => PaymentStatus.PartiallyRefunded,
            "expired" => PaymentStatus.Expired,
            "cancelled" or "canceled" => PaymentStatus.Cancelled,
            "refused" or "rejected" or "failed" or "error" => PaymentStatus.Failed,
            _ => PaymentStatus.Pending
        };
    }

    public static safefy_api_payment.Interfaces.WithdrawStatus ToWithdrawStatus(HeartPayWebhookStatus? status)
    {
        return ToWithdrawStatus(status?.ToString());
    }

    public static safefy_api_payment.Interfaces.WithdrawStatus ToWithdrawStatus(string? status)
    {
        return Normalize(status) switch
        {
            "paid" or "completed" or "done" or "success" or "succeeded" => safefy_api_payment.Interfaces.WithdrawStatus.Completed,
            "cancelled" or "canceled" => safefy_api_payment.Interfaces.WithdrawStatus.Cancelled,
            "refused" or "rejected" or "failed" or "error" => safefy_api_payment.Interfaces.WithdrawStatus.Failed,
            _ => safefy_api_payment.Interfaces.WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(HeartPayWebhookStatus? status)
    {
        return ToPayoutStatus(status?.ToString());
    }

    public static PayoutStatus ToPayoutStatus(string? status)
    {
        return Normalize(status) switch
        {
            "paid" or "completed" or "done" or "success" or "succeeded" => PayoutStatus.Completed,
            "cancelled" or "canceled" => PayoutStatus.Cancelled,
            "refused" or "rejected" => PayoutStatus.Rejected,
            "failed" or "error" => PayoutStatus.Failed,
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

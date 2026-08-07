using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Interfaces;

namespace swiftpay_api_payment.Services.Acquirers.Utils;

public static class FlevoPayStatusConverter
{
    public static PaymentStatus ToPaymentStatus(string? status)
    {
        return status?.ToLowerInvariant() switch
        {
            "pending" => PaymentStatus.Pending,
            "processing" => PaymentStatus.Processing,
            "approved" => PaymentStatus.Completed,
            "under_review" => PaymentStatus.Processing,
            "failed" => PaymentStatus.Failed,
            "refunded" => PaymentStatus.Refunded,
            "chargeback" => PaymentStatus.Disputed,
            _ => PaymentStatus.Pending
        };
    }
}
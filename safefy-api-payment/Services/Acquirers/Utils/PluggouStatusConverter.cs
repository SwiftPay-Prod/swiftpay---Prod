using safefy_api_core.Models.Database;
using safefy_api_payment.Clients.Pluggou.Models.Transactions;
using safefy_api_payment.Clients.Pluggou.Models.Withdrawals;
using safefy_api_payment.Clients.Pluggou.Models.Webhook;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Services.Acquirers.Utils;

public static class PluggouStatusConverter
{
    public static PaymentStatus ToPaymentStatus(string? status)
    {
        return ToPaymentStatus(ParseTransactionStatus(status));
    }

    public static PaymentStatus ToPaymentStatus(PluggouWebhookStatus? status)
    {
        return ToPaymentStatus(ParseTransactionStatus(status));
    }

    public static PaymentStatus ToPaymentStatus(PluggouTransactionStatus? status)
    {
        return status switch
        {
            PluggouTransactionStatus.Paid => PaymentStatus.Completed,
            PluggouTransactionStatus.Failed => PaymentStatus.Failed,
            PluggouTransactionStatus.Canceled => PaymentStatus.Cancelled,
            PluggouTransactionStatus.Refunded => PaymentStatus.Refunded,
            PluggouTransactionStatus.Chargeback => PaymentStatus.Refunded,
            _ => PaymentStatus.Pending
        };
    }

    public static WithdrawStatus ToWithdrawStatus(string? status)
    {
        return ToWithdrawStatus(ParseWithdrawalStatus(status));
    }

    public static WithdrawStatus ToWithdrawStatus(PluggouWebhookStatus? status)
    {
        return ToWithdrawStatus(ParseWithdrawalStatus(status));
    }

    public static WithdrawStatus ToWithdrawStatus(PluggouWithdrawalStatus? status)
    {
        return status switch
        {
            PluggouWithdrawalStatus.Approved => WithdrawStatus.Processing,
            PluggouWithdrawalStatus.Paid => WithdrawStatus.Completed,
            PluggouWithdrawalStatus.Failed => WithdrawStatus.Failed,
            PluggouWithdrawalStatus.Canceled => WithdrawStatus.Failed,
            PluggouWithdrawalStatus.Refunded => WithdrawStatus.Failed,
            _ => WithdrawStatus.Processing
        };
    }

    public static PayoutStatus ToPayoutStatus(string? status)
    {
        return ToPayoutStatus(ParseWithdrawalStatus(status));
    }

    public static PayoutStatus ToPayoutStatus(PluggouWebhookStatus? status)
    {
        return ToPayoutStatus(ParseWithdrawalStatus(status));
    }

    public static PayoutStatus ToPayoutStatus(PluggouWithdrawalStatus? status)
    {
        return status switch
        {
            PluggouWithdrawalStatus.Approved => PayoutStatus.Processing,
            PluggouWithdrawalStatus.Paid => PayoutStatus.Completed,
            PluggouWithdrawalStatus.Failed => PayoutStatus.Failed,
            PluggouWithdrawalStatus.Canceled => PayoutStatus.Failed,
            PluggouWithdrawalStatus.Refunded => PayoutStatus.Failed,
            _ => PayoutStatus.Processing
        };
    }

    private static PluggouTransactionStatus? ParseTransactionStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return PluggouTransactionStatus.Unknown;

        return status.Trim().ToLowerInvariant() switch
        {
            "pending" => PluggouTransactionStatus.Pending,
            "paid" => PluggouTransactionStatus.Paid,
            "failed" => PluggouTransactionStatus.Failed,
            "canceled" => PluggouTransactionStatus.Canceled,
            "cancelled" => PluggouTransactionStatus.Canceled,
            "refunded" => PluggouTransactionStatus.Refunded,
            "chargeback" => PluggouTransactionStatus.Chargeback,
            _ => PluggouTransactionStatus.Unknown
        };
    }

    private static PluggouWithdrawalStatus? ParseWithdrawalStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
            return PluggouWithdrawalStatus.Unknown;

        return status.Trim().ToLowerInvariant() switch
        {
            "pending" => PluggouWithdrawalStatus.Pending,
            "approved" => PluggouWithdrawalStatus.Approved,
            "paid" => PluggouWithdrawalStatus.Paid,
            "failed" => PluggouWithdrawalStatus.Failed,
            "canceled" => PluggouWithdrawalStatus.Canceled,
            "cancelled" => PluggouWithdrawalStatus.Canceled,
            "refunded" => PluggouWithdrawalStatus.Refunded,
            _ => PluggouWithdrawalStatus.Unknown
        };
    }

    private static PluggouTransactionStatus? ParseTransactionStatus(PluggouWebhookStatus? status)
    {
        return status switch
        {
            PluggouWebhookStatus.Pending => PluggouTransactionStatus.Pending,
            PluggouWebhookStatus.Approved => PluggouTransactionStatus.Pending,
            PluggouWebhookStatus.Paid => PluggouTransactionStatus.Paid,
            PluggouWebhookStatus.Failed => PluggouTransactionStatus.Failed,
            PluggouWebhookStatus.Canceled => PluggouTransactionStatus.Canceled,
            PluggouWebhookStatus.Refunded => PluggouTransactionStatus.Refunded,
            PluggouWebhookStatus.Chargeback => PluggouTransactionStatus.Chargeback,
            _ => PluggouTransactionStatus.Unknown
        };
    }

    private static PluggouWithdrawalStatus? ParseWithdrawalStatus(PluggouWebhookStatus? status)
    {
        return status switch
        {
            PluggouWebhookStatus.Pending => PluggouWithdrawalStatus.Pending,
            PluggouWebhookStatus.Approved => PluggouWithdrawalStatus.Approved,
            PluggouWebhookStatus.Paid => PluggouWithdrawalStatus.Paid,
            PluggouWebhookStatus.Failed => PluggouWithdrawalStatus.Failed,
            PluggouWebhookStatus.Canceled => PluggouWithdrawalStatus.Canceled,
            PluggouWebhookStatus.Refunded => PluggouWithdrawalStatus.Refunded,
            _ => PluggouWithdrawalStatus.Unknown
        };
    }
}

using Swiftpay.Domain.Enums;
using Swiftpay.Domain.ValueObjects;

namespace Swiftpay.Domain.Entities;

public class Transaction
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Money Amount { get; set; } = new(0);
    public TransactionType Type { get; set; }
    public TransactionStatus Status { get; set; } = TransactionStatus.Pending;
    public PaymentMethod Method { get; set; }
    public Guid? PaymentLinkId { get; set; }
    public string? GatewayTransactionId { get; set; }
    public string? PixKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    public void MarkAsPaid()
    {
        Status = TransactionStatus.Paid;
        PaidAt = DateTime.UtcNow;
    }

    public void MarkAsCancelled()
    {
        if (Status == TransactionStatus.Paid)
            throw new InvalidOperationException("Cannot cancel a paid transaction");
        Status = TransactionStatus.Cancelled;
    }

    public void MarkAsRefunded()
    {
        if (Status != TransactionStatus.Paid)
            throw new InvalidOperationException("Can only refund a paid transaction");
        Status = TransactionStatus.Refunded;
    }
}

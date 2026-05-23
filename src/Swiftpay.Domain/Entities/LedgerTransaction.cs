using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class LedgerTransaction
{
    public string Id { get; set; } = string.Empty;
    public long Amount { get; set; }
    public LedgerOperation Operation { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? PaymentId { get; set; }
    public Guid? PayoutId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<LedgerEntry> Entries { get; set; } = new List<LedgerEntry>();
}

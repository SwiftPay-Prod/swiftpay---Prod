using Swiftpay.Domain.Enums;

namespace Swiftpay.Domain.Entities;

public class LedgerEntry
{
    public string Id { get; set; } = string.Empty;
    public string LedgerTransactionId { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public LedgerEntryType Type { get; set; }
    public long Amount { get; set; }
    public string? Description { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Account Account { get; set; } = null!;
    public LedgerTransaction Transaction { get; set; } = null!;
}

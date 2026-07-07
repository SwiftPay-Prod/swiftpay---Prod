namespace swiftpay_api_core.Models.Ledger;

public class LedgerEntryInfo
{
    public string Id { get; set; } = null!;
    public string Type { get; set; } = null!;
    public long Amount { get; set; }
    public string Description { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

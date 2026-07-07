using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace swiftpay_api_core.Models.Database;

public class LedgerEntry : BaseEntity
{
    public LedgerEntry()
    {
        Id = $"e-{Guid.NewGuid()}";
    }

    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)]
    public string Id { get; set; }
    public string LedgerTransactionId { get; set; } = null!;
    public Guid AccountId { get; set; }
    public LedgerEntryType Type { get; set; }
    public long Amount { get; set; }
    public DateTime Timestamp { get; set; }
    public string Description { get; set; } = null!;

    // Relationships
    public LedgerTransaction LedgerTransaction { get; set; } = null!;
    public Account Account { get; set; } = null!;
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LedgerEntryType
{
    Credit,
    Debit
}
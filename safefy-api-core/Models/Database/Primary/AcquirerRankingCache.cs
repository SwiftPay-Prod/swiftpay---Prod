using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public class AcquirerRankingCache : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid AcquirerId { get; set; }
    public ApiEnvironment Environment { get; set; }

    public int SampleSize { get; set; }
    public int Position { get; set; }
    public decimal ApprovalRate { get; set; }
    public int ApprovedTransactions { get; set; }
    public int RejectedTransactions { get; set; }
    public int AnalyzedTransactions { get; set; }
    public DateTime CalculatedAt { get; set; }

    public Acquirer Acquirer { get; set; } = null!;
}
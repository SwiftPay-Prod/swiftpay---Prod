using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class ReferralCommissionPayment : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ReferrerUserId { get; set; }
    public Guid PaidByUserId { get; set; }
    public Guid? WithdrawalRequestId { get; set; }
    public long Amount { get; set; }
    public long RequestedAmount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public PixKeyType? PixKeyType { get; set; }
    public string? PixKey { get; set; }
    public string? Notes { get; set; }
    public string? LedgerTransactionId { get; set; }
    public Guid? ReceiptFileId { get; set; }
    public DateTime PaidAt { get; set; } = DateTime.UtcNow;

    public User ReferrerUser { get; set; } = null!;
    public User PaidByUser { get; set; } = null!;
    public ReferralCommissionWithdrawalRequest? WithdrawalRequest { get; set; }
    public LedgerTransaction? LedgerTransaction { get; set; }
    public StoredFile? ReceiptFile { get; set; }
}

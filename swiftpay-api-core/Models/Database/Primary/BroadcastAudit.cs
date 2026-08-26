using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class BroadcastAudit : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid ActorUserId { get; set; }
    public string Audience { get; set; } = null!;
    public Guid? MerchantId { get; set; }
    public string? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public string? ActionUrl { get; set; }
    public string Priority { get; set; } = null!;
    public int Total { get; set; }
    public int Processed { get; set; }
    public int Success { get; set; }
    public int Failure { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

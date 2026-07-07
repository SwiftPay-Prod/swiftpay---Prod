using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class BulletinReaction : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid BulletinId { get; set; }

    public Guid UserId { get; set; }

    [MaxLength(32)]
    public required string Emoji { get; set; }

    // Relationships
    public Bulletin? Bulletin { get; set; }
    public User? User { get; set; }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

public class Bulletin : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public DateTime ExpiresAt { get; set; }

    public Guid CreatedByUserId { get; set; }

    // Relationships
    public User? CreatedByUser { get; set; }
    public ICollection<BulletinRead> BulletinReads { get; set; } = [];
    public ICollection<BulletinReaction> BulletinReactions { get; set; } = [];
}

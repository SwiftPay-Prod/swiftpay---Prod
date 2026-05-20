using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace safefy_api_core.Models.Database;

public class BulletinRead : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid BulletinId { get; set; }

    public Guid UserId { get; set; }

    public DateTime ReadAt { get; set; }

    // Relationships
    public Bulletin? Bulletin { get; set; }
    public User? User { get; set; }
}

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_core.Models.Database;

public class UserNotificationTemplate : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public NotificationType Type { get; set; }

    public NotificationStatusType? StatusType { get; set; }

    [MaxLength(80)]
    public string? TitleTemplate { get; set; }

    [MaxLength(240)]
    public string? BodyTemplate { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

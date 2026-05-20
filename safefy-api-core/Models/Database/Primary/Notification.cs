using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using safefy_api_core.Models.Enum;

namespace safefy_api_core.Models.Database;

public class Notification : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    
    public NotificationScope Scope { get; set; } = NotificationScope.Merchant;
    
    public Guid? MerchantId { get; set; }
    public Guid? UserId { get; set; }
    
    public ApiEnvironment Environment { get; set; } = ApiEnvironment.Production;
    public NotificationType Type { get; set; }
    public NotificationStatusType? StatusType { get; set; }
    public NotificationPriority Priority { get; set; } = NotificationPriority.Normal;
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string? ActionUrl { get; set; }
    public string? ActionLabel { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }

    // Relationships
    public Merchant? Merchant { get; set; }
    public User? User { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum NotificationScope
{
    Merchant,
    User
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum NotificationType
{
    Info,
    Success,
    Warning,
    Error,
    Payment,
    Payout,
    Chargeback,
    Security,
    System
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum NotificationStatusType
{
    PaymentPending,
    PaymentCompleted,
    PaymentExpired,
    PaymentFailed,
    PaymentRefunded,
    PayoutPending,
    PayoutProcessing,
    PayoutCompleted,
    PayoutFailed,
    PayoutRejected,
    PayoutCancelled
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum NotificationPriority
{
    Low,
    Normal,
    High,
    Urgent
}

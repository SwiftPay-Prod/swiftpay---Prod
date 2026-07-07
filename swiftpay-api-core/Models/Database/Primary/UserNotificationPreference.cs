using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace swiftpay_api_core.Models.Database;

public class UserNotificationPreference : BaseEntity
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public bool PushNotificationsEnabled { get; set; } = true;
    public bool InAppNotificationsEnabled { get; set; } = true;

    public bool NotifyPaymentPending { get; set; } = true;
    public bool NotifyPaymentCompleted { get; set; } = true;
    public bool NotifyPaymentExpired { get; set; } = true;
    public bool NotifyPaymentFailed { get; set; } = true;
    public bool NotifyPaymentRefunded { get; set; } = true;

    public bool NotifyPayoutPending { get; set; } = true;
    public bool NotifyPayoutProcessing { get; set; } = true;
    public bool NotifyPayoutCompleted { get; set; } = true;
    public bool NotifyPayoutFailed { get; set; } = true;
    public bool NotifyPayoutRejected { get; set; } = true;
    public bool NotifyPayoutCancelled { get; set; } = true;

    public bool NotifyInfo { get; set; } = true;
    public bool NotifySuccess { get; set; } = true;
    public bool NotifyWarning { get; set; } = true;
    public bool NotifyError { get; set; } = true;
    public bool NotifySecurity { get; set; } = true;
    public bool NotifySystem { get; set; } = true;
    public bool NotifyChargeback { get; set; } = true;

    // Relationships
    public User User { get; set; } = null!;
}

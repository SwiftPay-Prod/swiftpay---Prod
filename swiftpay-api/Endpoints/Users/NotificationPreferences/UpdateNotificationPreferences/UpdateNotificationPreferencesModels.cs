using FastEndpoints;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.NotificationPreferences.UpdateNotificationPreferences;

public sealed class UpdateNotificationPreferencesRequest
{
    public bool? PushNotificationsEnabled { get; set; }
    public bool? InAppNotificationsEnabled { get; set; }

    public bool? NotifyPaymentPending { get; set; }
    public bool? NotifyPaymentCompleted { get; set; }
    public bool? NotifyPaymentExpired { get; set; }
    public bool? NotifyPaymentFailed { get; set; }
    public bool? NotifyPaymentRefunded { get; set; }

    public bool? NotifyPayoutPending { get; set; }
    public bool? NotifyPayoutProcessing { get; set; }
    public bool? NotifyPayoutCompleted { get; set; }
    public bool? NotifyPayoutFailed { get; set; }
    public bool? NotifyPayoutRejected { get; set; }
    public bool? NotifyPayoutCancelled { get; set; }

    public bool? NotifyInfo { get; set; }
    public bool? NotifySuccess { get; set; }
    public bool? NotifyWarning { get; set; }
    public bool? NotifyError { get; set; }
    public bool? NotifySecurity { get; set; }
    public bool? NotifySystem { get; set; }
    public bool? NotifyChargeback { get; set; }
}

public sealed class UpdateNotificationPreferencesResponse : BaseResponse<UpdateNotificationPreferencesData>;

public sealed class UpdateNotificationPreferencesData
{
    public Guid Id { get; set; }
    public bool PushNotificationsEnabled { get; set; }
    public bool InAppNotificationsEnabled { get; set; }

    public bool NotifyPaymentPending { get; set; }
    public bool NotifyPaymentCompleted { get; set; }
    public bool NotifyPaymentExpired { get; set; }
    public bool NotifyPaymentFailed { get; set; }
    public bool NotifyPaymentRefunded { get; set; }

    public bool NotifyPayoutPending { get; set; }
    public bool NotifyPayoutProcessing { get; set; }
    public bool NotifyPayoutCompleted { get; set; }
    public bool NotifyPayoutFailed { get; set; }
    public bool NotifyPayoutRejected { get; set; }
    public bool NotifyPayoutCancelled { get; set; }

    public bool NotifyInfo { get; set; }
    public bool NotifySuccess { get; set; }
    public bool NotifyWarning { get; set; }
    public bool NotifyError { get; set; }
    public bool NotifySecurity { get; set; }
    public bool NotifySystem { get; set; }
    public bool NotifyChargeback { get; set; }
}

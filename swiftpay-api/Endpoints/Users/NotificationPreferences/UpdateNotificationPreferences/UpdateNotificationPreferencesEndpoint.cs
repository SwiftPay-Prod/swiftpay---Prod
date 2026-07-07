using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Utils;

namespace swiftpay_api.Endpoints.Users.NotificationPreferences.UpdateNotificationPreferences;

public sealed class UpdateNotificationPreferencesEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<UpdateNotificationPreferencesRequest, UpdateNotificationPreferencesResponse>
{
    public override void Configure()
    {
        Patch("notification-preferences");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(UpdateNotificationPreferencesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new UpdateNotificationPreferencesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var prefs = await dbContext.UserNotificationPreferences
            .Where(p => p.UserId == userId.Value)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(ct);

        if (prefs == null)
        {
            prefs = new UserNotificationPreference
            {
                Id = Guid.CreateVersion7(),
                UserId = userId.Value
            };
            dbContext.UserNotificationPreferences.Add(prefs);
        }

        if (req.PushNotificationsEnabled.HasValue)
            prefs.PushNotificationsEnabled = req.PushNotificationsEnabled.Value;
        if (req.InAppNotificationsEnabled.HasValue)
            prefs.InAppNotificationsEnabled = req.InAppNotificationsEnabled.Value;

        if (req.NotifyPaymentPending.HasValue)
            prefs.NotifyPaymentPending = req.NotifyPaymentPending.Value;
        if (req.NotifyPaymentCompleted.HasValue)
            prefs.NotifyPaymentCompleted = req.NotifyPaymentCompleted.Value;
        if (req.NotifyPaymentExpired.HasValue)
            prefs.NotifyPaymentExpired = req.NotifyPaymentExpired.Value;
        if (req.NotifyPaymentFailed.HasValue)
            prefs.NotifyPaymentFailed = req.NotifyPaymentFailed.Value;
        if (req.NotifyPaymentRefunded.HasValue)
            prefs.NotifyPaymentRefunded = req.NotifyPaymentRefunded.Value;

        if (req.NotifyPayoutPending.HasValue)
            prefs.NotifyPayoutPending = req.NotifyPayoutPending.Value;
        if (req.NotifyPayoutProcessing.HasValue)
            prefs.NotifyPayoutProcessing = req.NotifyPayoutProcessing.Value;
        if (req.NotifyPayoutCompleted.HasValue)
            prefs.NotifyPayoutCompleted = req.NotifyPayoutCompleted.Value;
        if (req.NotifyPayoutFailed.HasValue)
            prefs.NotifyPayoutFailed = req.NotifyPayoutFailed.Value;
        if (req.NotifyPayoutRejected.HasValue)
            prefs.NotifyPayoutRejected = req.NotifyPayoutRejected.Value;
        if (req.NotifyPayoutCancelled.HasValue)
            prefs.NotifyPayoutCancelled = req.NotifyPayoutCancelled.Value;

        if (req.NotifyInfo.HasValue)
            prefs.NotifyInfo = req.NotifyInfo.Value;
        if (req.NotifySuccess.HasValue)
            prefs.NotifySuccess = req.NotifySuccess.Value;
        if (req.NotifyWarning.HasValue)
            prefs.NotifyWarning = req.NotifyWarning.Value;
        if (req.NotifyError.HasValue)
            prefs.NotifyError = req.NotifyError.Value;
        if (req.NotifySecurity.HasValue)
            prefs.NotifySecurity = req.NotifySecurity.Value;
        if (req.NotifySystem.HasValue)
            prefs.NotifySystem = req.NotifySystem.Value;
        if (req.NotifyChargeback.HasValue)
            prefs.NotifyChargeback = req.NotifyChargeback.Value;

        await dbContext.SaveChangesAsync(ct);

        await Send.OkAsync(new UpdateNotificationPreferencesResponse
        {
            Data = new UpdateNotificationPreferencesData
            {
                Id = prefs.Id,
                PushNotificationsEnabled = prefs.PushNotificationsEnabled,
                InAppNotificationsEnabled = prefs.InAppNotificationsEnabled,
                NotifyPaymentPending = prefs.NotifyPaymentPending,
                NotifyPaymentCompleted = prefs.NotifyPaymentCompleted,
                NotifyPaymentExpired = prefs.NotifyPaymentExpired,
                NotifyPaymentFailed = prefs.NotifyPaymentFailed,
                NotifyPaymentRefunded = prefs.NotifyPaymentRefunded,
                NotifyPayoutPending = prefs.NotifyPayoutPending,
                NotifyPayoutProcessing = prefs.NotifyPayoutProcessing,
                NotifyPayoutCompleted = prefs.NotifyPayoutCompleted,
                NotifyPayoutFailed = prefs.NotifyPayoutFailed,
                NotifyPayoutRejected = prefs.NotifyPayoutRejected,
                NotifyPayoutCancelled = prefs.NotifyPayoutCancelled,
                NotifyInfo = prefs.NotifyInfo,
                NotifySuccess = prefs.NotifySuccess,
                NotifyWarning = prefs.NotifyWarning,
                NotifyError = prefs.NotifyError,
                NotifySecurity = prefs.NotifySecurity,
                NotifySystem = prefs.NotifySystem,
                NotifyChargeback = prefs.NotifyChargeback
            },
            Message = "Preferências de notificação atualizadas com sucesso!"
        }, ct);
    }
}

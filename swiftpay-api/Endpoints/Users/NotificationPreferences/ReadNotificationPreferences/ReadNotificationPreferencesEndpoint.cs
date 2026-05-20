using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Users.NotificationPreferences.ReadNotificationPreferences;

public sealed class ReadNotificationPreferencesEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ReadNotificationPreferencesResponse>
{
    public override void Configure()
    {
        Get("notification-preferences");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadNotificationPreferencesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var prefs = await dbContext.UserNotificationPreferences
            .AsNoTracking()
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
            await dbContext.SaveChangesAsync(ct);
        }

        await Send.OkAsync(new ReadNotificationPreferencesResponse
        {
            Data = new NotificationPreferencesData
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
            }
        }, ct);
    }
}

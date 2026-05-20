using Microsoft.AspNetCore.SignalR;
using safefy_api.Hubs;
using safefy_api_core.Constants;
using safefy_api_core.Interfaces;

namespace safefy_api.Services.Internal;

public class NotificationHubService(IHubContext<MainHub> hubContext) : INotificationHubService
{
    public async Task SendToMerchantAsync(Guid merchantId, NotificationDto notification)
    {
        await hubContext.Clients
            .Group(SignalRGroups.Merchant(merchantId))
            .SendAsync(SignalRMethods.NotificationReceived, notification);
    }

    public async Task SendToUserAsync(Guid userId, NotificationDto notification)
    {
        await hubContext.Clients
            .Group(SignalRGroups.User(userId))
            .SendAsync(SignalRMethods.UserNotificationReceived, notification);
    }
}

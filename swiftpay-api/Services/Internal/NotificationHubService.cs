using Microsoft.AspNetCore.SignalR;
using swiftpay_api.Hubs;
using swiftpay_api_core.Constants;
using swiftpay_api_core.Interfaces;

namespace swiftpay_api.Services.Internal;

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

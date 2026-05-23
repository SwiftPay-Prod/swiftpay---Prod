using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Swiftpay.Api.Core.Hubs;

[Authorize]
public class DashboardHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var merchantId = Context.User?.FindFirst("company_id")?.Value;
        if (merchantId != null)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"merchant_{merchantId}");
        await base.OnConnectedAsync();
    }
}

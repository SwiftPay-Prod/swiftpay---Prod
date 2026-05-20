using Microsoft.AspNetCore.SignalR;
using safefy_api.Hubs;
using safefy_api_core.Constants;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Enum;

namespace safefy_api.Services.Internal;

public class DashboardHubService(
    IHubContext<MainHub> hubContext
) : IDashboardHubService
{
    public async Task NotifyMerchantDashboardUpdatedAsync(Guid merchantId)
    {
        await hubContext.Clients
            .Group(SignalRGroups.MerchantDashboard(merchantId))
            .SendAsync(SignalRMethods.MerchantDashboardUpdated, new { MerchantId = merchantId });
    }

    public async Task NotifyAdminDashboardUpdatedAsync(ApiEnvironment environment)
    {
        await hubContext.Clients
            .Group(SignalRGroups.AdminDashboard(environment.ToString()))
            .SendAsync(SignalRMethods.AdminDashboardUpdated, new { Environment = environment.ToString() });
    }

    public async Task NotifyAcquirerDashboardUpdatedAsync(Guid acquirerId)
    {
        await hubContext.Clients
            .Group(SignalRGroups.AcquirerDashboard(acquirerId))
            .SendAsync(SignalRMethods.AcquirerDashboardUpdated, new { AcquirerId = acquirerId });
    }
}

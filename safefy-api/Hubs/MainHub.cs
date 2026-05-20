using Microsoft.AspNetCore.SignalR;
using safefy_api.Interfaces;

namespace safefy_api.Hubs;

public class MainHub(ISessionService sessionService) : BaseHub(sessionService)
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserIdFromClaims();
        var deviceId = GetDeviceIdFromQuery();
        var merchantId = GetMerchantIdFromQuery();

        var tasks = new List<Task>();
        if (userId.HasValue) tasks.Add(JoinUserGroupAsync(userId.Value));
        if (!string.IsNullOrEmpty(deviceId)) tasks.Add(JoinDeviceGroupAsync(deviceId));
        if (!string.IsNullOrEmpty(merchantId)) tasks.Add(JoinMerchantGroupAsync(merchantId));
        await Task.WhenAll(tasks);

        await base.OnConnectedAsync();
    }

    public async Task JoinMerchantGroup(string merchantId)
    {
        await JoinMerchantGroupAsync(merchantId);
    }

    public async Task LeaveMerchantGroup(string merchantId)
    {
        await LeaveMerchantGroupAsync(merchantId);
    }

    public async Task JoinMerchantDashboard(Guid merchantId)
    {
        await JoinMerchantDashboardGroupAsync(merchantId);
    }

    public async Task LeaveMerchantDashboard(Guid merchantId)
    {
        await LeaveMerchantDashboardGroupAsync(merchantId);
    }

    public async Task JoinAdminDashboard(string environment)
    {
        if (!await IsAdminAsync())
        {
            throw new HubException("Acesso não autorizado.");
        }

        await JoinAdminDashboardGroupAsync(environment);
    }

    public async Task LeaveAdminDashboard(string environment)
    {
        await LeaveAdminDashboardGroupAsync(environment);
    }

    public async Task JoinAcquirerDashboard(Guid acquirerId)
    {
        if (!await IsAdminAsync())
        {
            throw new HubException("Acesso não autorizado.");
        }

        await JoinAcquirerDashboardGroupAsync(acquirerId);
    }

    public async Task LeaveAcquirerDashboard(Guid acquirerId)
    {
        await LeaveAcquirerDashboardGroupAsync(acquirerId);
    }
}

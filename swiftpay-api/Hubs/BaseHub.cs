using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using safefy_api.Interfaces;
using safefy_api_core.Constants;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Session;

namespace safefy_api.Hubs;

[Authorize]
public abstract class BaseHub(ISessionService sessionService) : Hub
{
    protected ISessionService SessionService { get; } = sessionService;

    protected string? GetSessionId()
    {
        return Context.User?.FindFirst("sid")?.Value;
    }

    protected Guid? GetUserIdFromClaims()
    {
        var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        return userId;
    }

    protected async Task<UserSession?> GetSessionAsync()
    {
        var sessionId = GetSessionId();
        if (string.IsNullOrEmpty(sessionId))
            return null;

        return await SessionService.GetSessionAsync(sessionId);
    }

    protected async Task<Guid?> GetUserIdAsync()
    {
        var session = await GetSessionAsync();
        return session?.UserId;
    }

    protected async Task<bool> IsAdminAsync()
    {
        var session = await GetSessionAsync();
        return session?.Role is UserRole.Admin or UserRole.God;
    }

    protected string? GetDeviceIdFromQuery()
    {
        return Context.GetHttpContext()?.Request.Query["deviceId"].ToString();
    }

    protected string? GetMerchantIdFromQuery()
    {
        return Context.GetHttpContext()?.Request.Query["merchantId"].ToString();
    }

    protected async Task JoinUserGroupAsync(Guid userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.User(userId));
    }

    protected async Task LeaveUserGroupAsync(Guid userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.User(userId));
    }

    protected async Task JoinDeviceGroupAsync(string deviceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Device(deviceId));
    }

    protected async Task LeaveDeviceGroupAsync(string deviceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Device(deviceId));
    }

    protected async Task JoinMerchantGroupAsync(Guid merchantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Merchant(merchantId));
    }

    protected async Task JoinMerchantGroupAsync(string merchantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.Merchant(merchantId));
    }

    protected async Task LeaveMerchantGroupAsync(Guid merchantId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Merchant(merchantId));
    }

    protected async Task LeaveMerchantGroupAsync(string merchantId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.Merchant(merchantId));
    }

    protected async Task JoinMerchantDashboardGroupAsync(Guid merchantId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.MerchantDashboard(merchantId));
    }

    protected async Task LeaveMerchantDashboardGroupAsync(Guid merchantId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.MerchantDashboard(merchantId));
    }

    protected async Task JoinAdminDashboardGroupAsync(string environment)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.AdminDashboard(environment));
    }

    protected async Task LeaveAdminDashboardGroupAsync(string environment)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.AdminDashboard(environment));
    }

    protected async Task JoinAcquirerDashboardGroupAsync(Guid acquirerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, SignalRGroups.AcquirerDashboard(acquirerId));
    }

    protected async Task LeaveAcquirerDashboardGroupAsync(Guid acquirerId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, SignalRGroups.AcquirerDashboard(acquirerId));
    }
}

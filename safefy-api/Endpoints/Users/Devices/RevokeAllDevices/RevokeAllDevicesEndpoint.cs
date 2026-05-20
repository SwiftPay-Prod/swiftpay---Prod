using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;
using safefy_api_core.Models.Inputs;
using safefy_api_core.Interfaces;
using safefy_api_core.Models.Database;
using Microsoft.AspNetCore.SignalR;
using safefy_api.Hubs;
using safefy_api_core.Constants;
using safefy_api.Interfaces;

namespace safefy_api.Endpoints.Users.Devices.RevokeAllDevices;

public sealed class RevokeAllDevicesEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    ISessionService sessionService,
    IHubContext<MainHub> authHub,
    IPushNotificationService pushNotificationService
) : Endpoint<RevokeAllDevicesRequest, RevokeAllDevicesResponse>
{
    public override void Configure()
    {
        Delete("devices");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(RevokeAllDevicesRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RevokeAllDevicesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var currentDeviceId = HttpContext.Request.Headers["X-Device-Id"].FirstOrDefault();
        var now = DateTime.UtcNow;

        var devicesToRevoke = await dbContext.TrustedDevices
            .Where(td => td.UserId == userId && td.IsActive)
            .ToListAsync(ct);

        if (req.KeepCurrent && !string.IsNullOrEmpty(currentDeviceId))
        {
            devicesToRevoke = devicesToRevoke.Where(d => d.DeviceId != currentDeviceId).ToList();
        }

        foreach (var device in devicesToRevoke)
        {
            device.IsActive = false;
            device.RevokedAt = now;

            await sessionService.InvalidateDeviceSessionsAsync(userId.Value, device.DeviceId);
            await pushNotificationService.UnregisterTokensByDeviceIdAsync(userId.Value, device.DeviceId);

            await authHub.Clients.Group(SignalRGroups.Device(device.DeviceId)).SendAsync(SignalRMethods.DeviceRevoked, new
            {
                deviceId = device.DeviceId,
                deviceName = device.DeviceName,
                reason = "Dispositivo removido pelo usuário."
            }, ct);
        }

        await dbContext.SaveChangesAsync(ct);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.DeviceRevoked,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"All trusted devices revoked. Count: {devicesToRevoke.Count}. Keep current: {req.KeepCurrent}"
        });

        var message = req.KeepCurrent && !string.IsNullOrEmpty(currentDeviceId)
            ? $"{devicesToRevoke.Count} dispositivo(s) removido(s). Dispositivo atual mantido."
            : $"{devicesToRevoke.Count} dispositivo(s) removido(s). Será necessário verificar em todos os dispositivos.";

        await Send.OkAsync(new RevokeAllDevicesResponse
        {
            Message = message
        }, ct);
    }
}

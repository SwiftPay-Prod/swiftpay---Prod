using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Models.Inputs;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Constants;
using swiftpay_api.Hubs;
using swiftpay_api.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace swiftpay_api.Endpoints.Users.Devices.RevokeDevice;

public sealed class RevokeDeviceEndpoint(
    PrimaryDbContext dbContext,
    ISecurityLogService securityLog,
    ISessionService sessionService,
    IHubContext<MainHub> authHub,
    IPushNotificationService pushNotificationService
) : Endpoint<RevokeDeviceRequest, RevokeDeviceResponse>
{
    public override void Configure()
    {
        Delete("devices/{deviceId}");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(RevokeDeviceRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new RevokeDeviceResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var device = await dbContext.TrustedDevices
            .Where(td => td.DeviceId == req.DeviceId && td.UserId == userId && td.IsActive)
            .OrderBy(td => td.Id)
            .FirstOrDefaultAsync(ct);

        if (device == null)
        {
            await Send.ResponseAsync(new RevokeDeviceResponse
            {
                Error = new("Dispositivo não encontrado.")
            }, 404, ct);
            return;
        }

        device.IsActive = false;
        device.RevokedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);

        await sessionService.InvalidateDeviceSessionsAsync(userId.Value, device.DeviceId);

        await pushNotificationService.UnregisterTokensByDeviceIdAsync(userId.Value, device.DeviceId);

        await securityLog.LogAsync(new SecurityLogInput
        {
            Action = SecurityLogAction.DeviceRevoked,
            Status = SecurityLogStatus.Success,
            UserId = userId,
            Details = $"Trusted device revoked: {device.DeviceName} ({device.DeviceId})"
        });

        await authHub.Clients.Group(SignalRGroups.Device(device.DeviceId)).SendAsync(SignalRMethods.DeviceRevoked, new
        {
            deviceId = device.DeviceId,
            deviceName = device.DeviceName,
            reason = "Dispositivo removido pelo usuário."
        }, ct);

        await Send.OkAsync(new RevokeDeviceResponse
        {
            Message = "Dispositivo removido com sucesso. Será necessário verificar o dispositivo no próximo login."
        }, ct);
    }
}

using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Utils;
using safefy_api.EndpointsGroups;

namespace safefy_api.Endpoints.Users.Devices.ListDevices;

public sealed class ListDevicesEndpoint(
    PrimaryDbContext dbContext
) : EndpointWithoutRequest<ListDevicesResponse>
{
    public override void Configure()
    {
        Get("devices");
        Group<UserGroup>();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ListDevicesResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var currentDeviceId = HttpContext.Request.Headers["X-Device-Id"].FirstOrDefault();

        var devices = await dbContext.TrustedDevices
            .Where(td => td.UserId == userId && td.IsActive)
            .OrderByDescending(td => td.LastUsedAt ?? td.CreatedAt)
            .Select(td => new TrustedDeviceData
            {
                Id = td.Id,
                DeviceId = td.DeviceId,
                DeviceName = td.DeviceName,
                Browser = td.Browser,
                OperatingSystem = td.OperatingSystem,
                LastIpAddress = td.LastIpAddress,
                LastLocation = td.LastLocation,
                LastUsedAt = td.LastUsedAt,
                CreatedAt = td.CreatedAt,
                IsCurrent = td.DeviceId == currentDeviceId
            })
            .ToListAsync(ct);

        await Send.OkAsync(new ListDevicesResponse
        {
            Data = new ListDevicesData
            {
                Devices = devices,
                CurrentDeviceId = currentDeviceId
            }
        }, ct);
    }
}

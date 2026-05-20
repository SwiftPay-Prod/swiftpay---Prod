using FastEndpoints;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Devices.RevokeAllDevices;

public class RevokeAllDevicesRequest
{
    public bool KeepCurrent { get; set; } = true;
}

public class RevokeAllDevicesResponse : BaseResponse;

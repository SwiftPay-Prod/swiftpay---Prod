using FastEndpoints;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Devices.RevokeAllDevices;

public class RevokeAllDevicesRequest
{
    public bool KeepCurrent { get; set; } = true;
}

public class RevokeAllDevicesResponse : BaseResponse;

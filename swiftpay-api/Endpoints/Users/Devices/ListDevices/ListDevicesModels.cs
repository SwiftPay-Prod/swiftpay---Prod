using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Devices.ListDevices;

public class ListDevicesRequest
{
}

public class ListDevicesResponse : BaseResponse<ListDevicesData>;

public class ListDevicesData
{
    public List<TrustedDeviceData> Devices { get; set; } = [];
    public string? CurrentDeviceId { get; set; }
}

public class TrustedDeviceData
{
    public Guid Id { get; set; }
    public string DeviceId { get; set; } = null!;
    public string? DeviceName { get; set; }
    public string? Browser { get; set; }
    public string? OperatingSystem { get; set; }
    public string? LastIpAddress { get; set; }
    public string? LastLocation { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsCurrent { get; set; }
}

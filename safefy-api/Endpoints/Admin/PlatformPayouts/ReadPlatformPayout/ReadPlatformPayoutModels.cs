using FastEndpoints;
using safefy_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.ReadPlatformPayout;

public sealed class ReadPlatformPayoutRequest
{
    public Guid Id { get; set; }
}

public sealed class ReadPlatformPayoutResponse : BaseResponse<AdminPlatformPayoutData>;

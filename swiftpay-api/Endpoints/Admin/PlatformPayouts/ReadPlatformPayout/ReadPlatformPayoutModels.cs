using FastEndpoints;
using swiftpay_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.ReadPlatformPayout;

public sealed class ReadPlatformPayoutRequest
{
    public Guid Id { get; set; }
}

public sealed class ReadPlatformPayoutResponse : BaseResponse<AdminPlatformPayoutData>;

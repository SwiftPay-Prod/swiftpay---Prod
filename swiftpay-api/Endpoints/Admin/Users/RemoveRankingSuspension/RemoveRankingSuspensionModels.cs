using FastEndpoints;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.RemoveRankingSuspension;

public sealed class RemoveRankingSuspensionRequest
{
    public Guid UserId { get; set; }
}

public sealed class RemoveRankingSuspensionResponse : BaseResponse<string>;

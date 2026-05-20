using FastEndpoints;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Users.RemoveRankingSuspension;

public sealed class RemoveRankingSuspensionRequest
{
    public Guid UserId { get; set; }
}

public sealed class RemoveRankingSuspensionResponse : BaseResponse<string>;

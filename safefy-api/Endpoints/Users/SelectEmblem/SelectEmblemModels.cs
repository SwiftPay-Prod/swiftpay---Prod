using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.SelectEmblem;

public sealed class SelectEmblemRequest
{
    public Guid? AchievementId { get; set; }
}

public sealed class SelectEmblemResponse : BaseResponse;

using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.SelectEmblem;

public sealed class SelectEmblemRequest
{
    public Guid? AchievementId { get; set; }
}

public sealed class SelectEmblemResponse : BaseResponse;

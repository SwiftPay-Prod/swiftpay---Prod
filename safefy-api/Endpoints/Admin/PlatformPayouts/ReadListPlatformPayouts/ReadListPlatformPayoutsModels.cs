using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.ReadListPlatformPayouts;

public sealed class ReadListPlatformPayoutsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public PlatformPayoutStatus? Status { get; set; }
}

public sealed class ReadListPlatformPayoutsRequestValidator : Validator<ReadListPlatformPayoutsRequest>
{
    public ReadListPlatformPayoutsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListPlatformPayoutsResponse : BaseResponse<Paginated<AdminPlatformPayoutData>>;

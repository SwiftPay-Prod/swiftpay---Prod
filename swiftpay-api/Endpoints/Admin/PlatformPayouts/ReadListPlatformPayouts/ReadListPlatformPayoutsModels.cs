using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Admin.PlatformPayouts.CreatePlatformPayout;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.PlatformPayouts.ReadListPlatformPayouts;

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

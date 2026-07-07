using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Admin.PlatformPayoutAccounts.CreatePlatformPayoutAccount;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Admin.PlatformPayoutAccounts.ReadListPlatformPayoutAccounts;

public sealed class ReadListPlatformPayoutAccountsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadListPlatformPayoutAccountsRequestValidator : Validator<ReadListPlatformPayoutAccountsRequest>
{
    public ReadListPlatformPayoutAccountsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListPlatformPayoutAccountsResponse : BaseResponse<Paginated<AdminPlatformPayoutAccountData>>;

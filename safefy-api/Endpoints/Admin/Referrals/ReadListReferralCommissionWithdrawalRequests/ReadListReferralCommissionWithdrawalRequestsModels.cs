using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api.Validators;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Referrals.ReadListReferralCommissionWithdrawalRequests;

public sealed class ReadListReferralCommissionWithdrawalRequestsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public ReferralCommissionWithdrawalRequestStatus? Status { get; set; }
    public string? Search { get; set; }
    public Guid? UserId { get; set; }
}

public sealed class ReadListReferralCommissionWithdrawalRequestsRequestValidator : Validator<ReadListReferralCommissionWithdrawalRequestsRequest>
{
    public ReadListReferralCommissionWithdrawalRequestsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Search)
            .MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.Search))
            .WithMessage("Search deve ter no máximo 100 caracteres");
    }
}

public sealed class ReadListReferralCommissionWithdrawalRequestsResponse : BaseResponse<Paginated<AdminMinimalReferralCommissionWithdrawalRequest>>;

public sealed class AdminMinimalReferralCommissionWithdrawalRequest
{
    public Guid Id { get; set; }
    public Guid ReferrerUserId { get; set; }
    public string ReferrerName { get; set; } = string.Empty;
    public string ReferrerEmail { get; set; } = string.Empty;
    public long Amount { get; set; }
    public DateTime RequestedAt { get; set; }
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }
    public string? Notes { get; set; }
}

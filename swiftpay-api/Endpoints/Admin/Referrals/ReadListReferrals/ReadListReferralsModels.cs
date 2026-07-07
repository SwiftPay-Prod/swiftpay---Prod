using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api.Validators;

namespace swiftpay_api.Endpoints.Admin.Referrals.ReadListReferrals;

public sealed class ReadListReferralsRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Guid? ReferrerUserId { get; set; }
    public UserStatus? ReferredUserStatus { get; set; }
    public string? Search { get; set; }
}

public sealed class ReadListReferralsRequestValidator : Validator<ReadListReferralsRequest>
{
    public ReadListReferralsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Search)
            .MaximumLength(100).WithMessage("Search deve ter no máximo 100 caracteres");
    }
}

public sealed class ReadListReferralsResponse : BaseResponse<AdminReferralsData>;

public sealed class AdminReferralsData
{
    public AdminReferralsSummaryData Summary { get; set; } = new();
    public Paginated<AdminMinimalReferredUser> ReferredUsers { get; set; } = new();
}

public sealed class AdminReferralsSummaryData
{
    public int TotalReferredUsers { get; set; }
    public int TotalReferrers { get; set; }
    public long TotalEstimatedCommissionFromPayments { get; set; }
    public long TotalEstimatedCommissionFromPayouts { get; set; }
    public long TotalEstimatedCommission { get; set; }
}

public sealed class AdminMinimalReferredUser
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserStatus Status { get; set; }

    public DateTime? ReferredAt { get; set; }

    public Guid ReferrerUserId { get; set; }
    public string ReferrerName { get; set; } = string.Empty;
    public string ReferrerEmail { get; set; } = string.Empty;

    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
}

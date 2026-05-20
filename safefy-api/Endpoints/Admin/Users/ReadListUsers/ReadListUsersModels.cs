using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api.Validators;

namespace safefy_api.Endpoints.Admin.Users.ReadListUsers;

public sealed class ReadListUsersRequest : IPaginatedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public UserStatus? Status { get; set; }
    public UserRole? Role { get; set; }
    public bool? WasReferred { get; set; }
    public string? Search { get; set; }
    public string? SortBy { get; set; } = "createdAt";
    public string? SortOrder { get; set; } = "desc";
}

public sealed class ReadListUsersRequestValidator : Validator<ReadListUsersRequest>
{
    public ReadListUsersRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Search)
            .MaximumLength(100).WithMessage("Search deve ter no máximo 100 caracteres");

        RuleFor(x => x.SortBy)
            .Must(v => string.IsNullOrWhiteSpace(v)
                || v.Equals("createdAt", StringComparison.OrdinalIgnoreCase)
                || v.Equals("referredUsersCount", StringComparison.OrdinalIgnoreCase)
                || v.Equals("availableCommissionBalance", StringComparison.OrdinalIgnoreCase)
                || v.Equals("generatedReferralCommission", StringComparison.OrdinalIgnoreCase))
            .WithMessage("SortBy inválido. Use createdAt, referredUsersCount, availableCommissionBalance ou generatedReferralCommission.");

        RuleFor(x => x.SortOrder)
            .Must(v => string.IsNullOrWhiteSpace(v)
                || v.Equals("asc", StringComparison.OrdinalIgnoreCase)
                || v.Equals("desc", StringComparison.OrdinalIgnoreCase))
            .WithMessage("SortOrder inválido. Use asc ou desc.");
    }
}

public sealed class ReadListUsersResponse : BaseResponse<Paginated<AdminMinimalUser>>;

public sealed class AdminMinimalUser
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? WhatsApp { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserStatus Status { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserRole Role { get; set; }

    public bool EmailVerified { get; set; }
    public int MerchantCount { get; set; }
    public int ReferredUsersCount { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public bool WasReferred { get; set; }
    public DateTime? ReferredAt { get; set; }
    public long GeneratedReferralCommission { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? RankingSuspendedUntil { get; set; }
    public string? RankingSuspensionReason { get; set; }
}

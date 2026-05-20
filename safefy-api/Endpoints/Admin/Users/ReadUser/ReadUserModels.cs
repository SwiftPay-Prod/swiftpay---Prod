using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Users.ReadUser;

public sealed class ReadUserRequest
{
    public Guid UserId { get; set; }
}

public sealed class ReadUserRequestValidator : Validator<ReadUserRequest>
{
    public ReadUserRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório.");
    }
}

public sealed class ReadUserResponse : BaseResponse<AdminUserDetails>;

public sealed class AdminUserDetails
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? WhatsApp { get; set; }
    public UserRole Role { get; set; }
    public UserStatus Status { get; set; }

    public bool EmailVerified { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public bool IsLockedOut { get; set; }
    public int FailedLoginAttempts { get; set; }

    public string? InactiveReason { get; set; }
    public string? SuspendedReason { get; set; }

    public DateTime? LastLoginAt { get; set; }
    public string? LastLoginIpAddress { get; set; }
    public string? LastLoginUserAgent { get; set; }
    public string? LastLoginLocation { get; set; }
    public DateTime? LockedOutAt { get; set; }
    public DateTime? PasswordChangedAt { get; set; }
    public Guid? ReferredByUserId { get; set; }
    public string? ReferredByUserName { get; set; }
    public string? ReferredByUserEmail { get; set; }
    public DateTime? ReferredAt { get; set; }
    public int? ReferralDurationMonths { get; set; }
    public int? ReferralCommissionPercentage { get; set; }
    public int? ReferralCommissionWithdrawalIntervalValue { get; set; }
    public ReferralWithdrawalIntervalUnit? ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long? ReferralCommissionMinWithdrawalAmount { get; set; }
    public long? ReferralCommissionWithdrawalFeeFixed { get; set; }
    public PixKeyType? ReferralPayoutPixKeyType { get; set; }
    public string? ReferralPayoutPixKey { get; set; }
    public AdminReferralCommissionSummaryData ReferralCommission { get; set; } = new();
    public AdminUserOnboardingData Onboarding { get; set; } = new();

    public bool HasWayneProtocolAccess { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<AdminMerchantSummary> Merchants { get; set; } = [];
}

public sealed class AdminUserOnboardingData
{
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<string> Discovery { get; set; } = [];
    public string? DiscoveryOther { get; set; }
    public List<string> Channels { get; set; } = [];
    public string? ChannelsOther { get; set; }
    public List<string> Goals { get; set; } = [];
    public string? GoalsOther { get; set; }
}

public sealed class AdminReferralCommissionSummaryData
{
    public long EstimatedCommissionTotal { get; set; }
    public long PaidCommissionTotal { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public List<AdminReferralCommissionPaymentHistoryData> PaymentHistory { get; set; } = [];
}

public sealed class AdminReferralCommissionPaymentHistoryData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public DateTime PaidAt { get; set; }
    public Guid PaidByUserId { get; set; }
    public string? PaidByUserName { get; set; }
    public string? Notes { get; set; }
    public PixKeyType? PixKeyType { get; set; }
    public string? PixKey { get; set; }
}

public sealed class AdminMerchantSummary
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Document { get; set; }
    public MerchantStatus Status { get; set; }
    public long TotalRevenue { get; set; }
}

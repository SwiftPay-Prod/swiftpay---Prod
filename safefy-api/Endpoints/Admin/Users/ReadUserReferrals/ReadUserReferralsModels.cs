using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Users.ReadUserReferrals;

public sealed class ReadUserReferralsRequest
{
    public Guid UserId { get; set; }
}

public sealed class ReadUserReferralsRequestValidator : Validator<ReadUserReferralsRequest>
{
    public ReadUserReferralsRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório.");
    }
}

public sealed class ReadUserReferralsResponse : BaseResponse<AdminUserReferralsData>;

public sealed class AdminUserReferralsData
{
    public string ReferralCode { get; set; } = string.Empty;
    public string ReferralLink { get; set; } = string.Empty;
    public int ReferralDurationMonths { get; set; }
    public int ReferralCommissionPercentage { get; set; }
    public long EligibleProfitFromPayments { get; set; }
    public long EligibleProfitFromPayouts { get; set; }
    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
    public long PaidCommissionTotal { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public int ReferralCommissionWithdrawalIntervalValue { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralWithdrawalIntervalUnit ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long ReferralCommissionMinWithdrawalAmount { get; set; }
    public long ReferralCommissionWithdrawalFeeFixed { get; set; }
    public DateTime? ReferralCommissionNextAllowedWithdrawalRequestAt { get; set; }
    public bool CanRequestReferralCommissionWithdrawal { get; set; }
    public PixKeyType? PayoutPixKeyType { get; set; }
    public string? PayoutPixKey { get; set; }
    public List<AdminReferralCommissionWithdrawalRequestData> WithdrawalRequests { get; set; } = [];
    public List<AdminReferralCommissionPaymentHistoryData> PaymentHistory { get; set; } = [];
    public List<AdminReferredUserData> ReferredUsers { get; set; } = [];
}

public sealed class AdminReferralCommissionWithdrawalRequestData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public DateTime RequestedAt { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }

    public string? Notes { get; set; }
}

public sealed class AdminReferralCommissionPaymentHistoryData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
    public FileData? ReceiptFile { get; set; }
}

public sealed class AdminReferredUserData
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public UserStatus Status { get; set; }

    public DateTime? ReferredAt { get; set; }
    public long EligibleProfitFromPayments { get; set; }
    public long EligibleProfitFromPayouts { get; set; }
    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
}

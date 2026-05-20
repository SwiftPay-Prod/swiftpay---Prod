using System.Text.Json.Serialization;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Users.Referrals.ReadMyReferrals;

public sealed class ReadMyReferralsResponse : BaseResponse<ReadMyReferralsData>;

public sealed class ReadMyReferralsData
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
    public List<ReferralCommissionWithdrawalRequestData> WithdrawalRequests { get; set; } = [];
    public List<ReferralCommissionPaymentHistoryData> PaymentHistory { get; set; } = [];
    public List<ReferredUserData> ReferredUsers { get; set; } = [];
}

public sealed class ReferralCommissionWithdrawalRequestData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public DateTime RequestedAt { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }

    public string? Notes { get; set; }
    public string? ReviewReason { get; set; }
}

public sealed class ReferralCommissionPaymentHistoryData
{
    public Guid Id { get; set; }
    public long Amount { get; set; }
    public long RequestedAmount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public PixKeyType? PixKeyType { get; set; }
    public string? PixKey { get; set; }
    public string? PaidByUserName { get; set; }
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
    public FileData? ReceiptFile { get; set; }
}

public sealed class ReferredUserData
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

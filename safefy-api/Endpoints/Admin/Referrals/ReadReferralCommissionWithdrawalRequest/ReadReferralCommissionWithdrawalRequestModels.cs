using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Referrals.ReadReferralCommissionWithdrawalRequest;

public sealed class ReadReferralCommissionWithdrawalRequestRequest
{
    public Guid RequestId { get; set; }
}

public sealed class ReadReferralCommissionWithdrawalRequestRequestValidator : Validator<ReadReferralCommissionWithdrawalRequestRequest>
{
    public ReadReferralCommissionWithdrawalRequestRequestValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("O identificador da solicitação é obrigatório.");
    }
}

public sealed class ReadReferralCommissionWithdrawalRequestResponse : BaseResponse<AdminReferralCommissionWithdrawalRequestDetails>;

public sealed class AdminReferralCommissionWithdrawalRequestDetails
{
    public Guid Id { get; set; }
    public Guid ReferrerUserId { get; set; }
    public string ReferrerName { get; set; } = string.Empty;
    public string ReferrerEmail { get; set; } = string.Empty;
    public UserStatus ReferrerStatus { get; set; }
    public long RequestedAmount { get; set; }
    public DateTime RequestedAt { get; set; }
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }
    public string? RequestNotes { get; set; }
    public string? ReviewReason { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public long PendingWithdrawalRequestsTotal { get; set; }
    public int ReferralDurationMonths { get; set; }
    public int ReferralCommissionPercentage { get; set; }
    public int ReferralCommissionWithdrawalIntervalValue { get; set; }
    public ReferralWithdrawalIntervalUnit ReferralCommissionWithdrawalIntervalUnit { get; set; }
    public long ReferralCommissionMinWithdrawalAmount { get; set; }
    public long ReferralCommissionWithdrawalFeeFixed { get; set; }
    public PixKeyType? PayoutPixKeyType { get; set; }
    public string? PayoutPixKey { get; set; }
    public AdminReferralCommissionWithdrawalPaymentDetails? Payment { get; set; }
}

public sealed class AdminReferralCommissionWithdrawalPaymentDetails
{
    public Guid Id { get; set; }
    public long PaidAmount { get; set; }
    public long RequestedAmount { get; set; }
    public long FeeAmount { get; set; }
    public long NetAmount { get; set; }
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
    public string? LedgerTransactionId { get; set; }
    public Guid PaidByUserId { get; set; }
    public string PaidByUserName { get; set; } = string.Empty;
    public string PaidByUserEmail { get; set; } = string.Empty;
    public PixKeyType? PixKeyType { get; set; }
    public string? PixKey { get; set; }
    public FileData? ReceiptFile { get; set; }
}

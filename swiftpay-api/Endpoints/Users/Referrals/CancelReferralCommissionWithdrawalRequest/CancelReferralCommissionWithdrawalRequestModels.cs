using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Users.Referrals.CancelReferralCommissionWithdrawalRequest;

public sealed class CancelReferralCommissionWithdrawalRequestRequest
{
    public Guid RequestId { get; set; }
}

public sealed class CancelReferralCommissionWithdrawalRequestValidator : Validator<CancelReferralCommissionWithdrawalRequestRequest>
{
    public CancelReferralCommissionWithdrawalRequestValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("O identificador da solicitação é obrigatório.");
    }
}

public sealed class CancelReferralCommissionWithdrawalRequestResponse : BaseResponse<CancelReferralCommissionWithdrawalRequestData>;

public sealed class CancelReferralCommissionWithdrawalRequestData
{
    public Guid RequestId { get; set; }
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }
    public long ReleasedAmount { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public long PendingWithdrawalRequestsTotal { get; set; }
}
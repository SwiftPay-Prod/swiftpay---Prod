using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Referrals.RequestReferralPayoutPixKeyUpdate;

public sealed class RequestReferralPayoutPixKeyUpdateRequest;

public sealed class RequestReferralPayoutPixKeyUpdateRequestValidator : Validator<RequestReferralPayoutPixKeyUpdateRequest>
{
    public RequestReferralPayoutPixKeyUpdateRequestValidator()
    {
    }
}

public sealed class RequestReferralPayoutPixKeyUpdateResponse : BaseResponse<RequestReferralPayoutPixKeyUpdateData>;

public sealed class RequestReferralPayoutPixKeyUpdateData
{
    public Guid VerificationId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string MaskedEmail { get; set; } = string.Empty;
}

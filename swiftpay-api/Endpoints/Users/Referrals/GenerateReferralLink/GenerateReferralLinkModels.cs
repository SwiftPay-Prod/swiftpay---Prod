using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Referrals.GenerateReferralLink;

public sealed class GenerateReferralLinkResponse : BaseResponse<GenerateReferralLinkData>;

public sealed class GenerateReferralLinkData
{
    public string ReferralCode { get; set; } = string.Empty;
    public string ReferralLink { get; set; } = string.Empty;
}

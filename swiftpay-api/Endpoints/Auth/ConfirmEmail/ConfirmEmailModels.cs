using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.ConfirmEmail;

public sealed class ConfirmEmailRequest
{
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
}

public sealed class ConfirmEmailResponse : BaseResponse<UserInfo>;

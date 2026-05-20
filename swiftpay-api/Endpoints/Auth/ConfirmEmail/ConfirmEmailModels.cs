using safefy_api.Endpoints.Auth.Shared.Models;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Auth.ConfirmEmail;

public sealed class ConfirmEmailRequest
{
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
}

public sealed class ConfirmEmailResponse : BaseResponse<UserInfo>;

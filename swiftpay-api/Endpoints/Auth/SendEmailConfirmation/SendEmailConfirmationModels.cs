using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.SendEmailConfirmation;

public sealed class SendEmailConfirmationRequest
{
    public string Email { get; set; } = null!;
}

public sealed class SendEmailConfirmationResponse : BaseResponse;

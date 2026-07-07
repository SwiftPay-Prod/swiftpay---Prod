using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.PushTokens.UnregisterPushToken;

public sealed class UnregisterPushTokenRequest
{
    public string Token { get; set; } = string.Empty;
}

public sealed class UnregisterPushTokenRequestValidator : Validator<UnregisterPushTokenRequest>
{
    public UnregisterPushTokenRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("O token é obrigatório.");
    }
}

public sealed class UnregisterPushTokenResponse : BaseResponse;

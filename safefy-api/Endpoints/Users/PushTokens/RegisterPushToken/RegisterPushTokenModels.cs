using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.PushTokens.RegisterPushToken;

public sealed class RegisterPushTokenRequest
{
    public string Token { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public string? DeviceName { get; set; }
    public string? DeviceId { get; set; }
}

public sealed class RegisterPushTokenRequestValidator : Validator<RegisterPushTokenRequest>
{
    public RegisterPushTokenRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage("O token é obrigatório.")
            .MaximumLength(500).WithMessage("O token deve ter no máximo 500 caracteres.");

        RuleFor(x => x.Platform)
            .NotEmpty().WithMessage("A plataforma é obrigatória.")
            .Must(x => x is "web" or "ios" or "android").WithMessage("A plataforma deve ser 'web', 'ios' ou 'android'.");
    }
}

public sealed class RegisterPushTokenResponse : BaseResponse;

using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.SignUp;

public class SignUpRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string WhatsApp { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? DeviceId { get; set; }
    public string? RefCode { get; set; }
}

public class SignUpRequestValidator : Validator<SignUpRequest>
{
    public SignUpRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório")
            .MinimumLength(2).WithMessage("Nome deve ter no mínimo 2 caracteres")
            .MaximumLength(100).WithMessage("Nome deve ter no máximo 100 caracteres");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email é obrigatório")
            .EmailAddress().WithMessage("Email inválido");

        RuleFor(x => x.WhatsApp)
            .NotEmpty().WithMessage("WhatsApp é obrigatório")
            .MaximumLength(32).WithMessage("WhatsApp inválido")
            .Matches(@"^\+[1-9]\d{7,14}$")
            .WithMessage("Informe um WhatsApp válido com o DDI do país");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha é obrigatória")
            .MinimumLength(8).WithMessage("Senha deve ter no mínimo 8 caracteres")
            .Matches(@"[A-Z]").WithMessage("Senha deve conter pelo menos uma letra maiúscula")
            .Matches(@"[a-z]").WithMessage("Senha deve conter pelo menos uma letra minúscula")
            .Matches(@"[0-9]").WithMessage("Senha deve conter pelo menos um número")
            .Matches(@"[^a-zA-Z0-9]").WithMessage("Senha deve conter pelo menos um caractere especial");

        RuleFor(x => x.RefCode)
            .MaximumLength(32).WithMessage("Código de indicação inválido.")
            .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Código de indicação inválido.")
            .When(x => !string.IsNullOrWhiteSpace(x.RefCode));
    }
}

public class SignUpResponse : BaseResponse<SignUpResponseData>;

public class SignUpResponseData
{
    public bool RequiresDeviceVerification { get; set; }
    public string? MaskedEmail { get; set; }
    public UserInfo? User { get; set; }
    public AuthTokens? Tokens { get; set; }
    public CurrentDeviceData? CurrentDevice { get; set; }
}

public class CurrentDeviceData
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
}

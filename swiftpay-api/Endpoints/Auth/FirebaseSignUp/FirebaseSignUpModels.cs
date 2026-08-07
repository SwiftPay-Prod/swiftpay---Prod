using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.FirebaseSignUp;

public class FirebaseSignUpRequest
{
    /// <summary>Firebase ID token (same token used for sign-in; Google provisioning reuses it).</summary>
    public string IdToken { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string? WhatsApp { get; set; }

    public string? DeviceId { get; set; }

    public string? RefCode { get; set; }
}

public class FirebaseSignUpRequestValidator : Validator<FirebaseSignUpRequest>
{
    public FirebaseSignUpRequestValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("Token de autenticação é obrigatório");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Nome é obrigatório")
            .MaximumLength(150).WithMessage("Nome muito longo");

        RuleFor(x => x.WhatsApp)
            .MaximumLength(30).WithMessage("WhatsApp inválido")
            .When(x => x.WhatsApp != null);

        RuleFor(x => x.DeviceId)
            .MaximumLength(100).WithMessage("DeviceId inválido")
            .When(x => x.DeviceId != null);

        RuleFor(x => x.RefCode)
            .MaximumLength(50).WithMessage("Código de indicação inválido")
            .When(x => x.RefCode != null);
    }
}

public class FirebaseSignUpResponse : BaseResponse<FirebaseSignUpResponseData>;

public class FirebaseSignUpResponseData
{
    /// <summary>
    /// True when the account was created but email verification is required
    /// (email/password provider only). When true, no platform JWT is issued.
    /// </summary>
    public bool RequiresEmailVerification { get; set; }

    /// <summary>Auth data (present only when the sign-up completed and a JWT was issued).</summary>
    public AuthResponse? Auth { get; set; }
}

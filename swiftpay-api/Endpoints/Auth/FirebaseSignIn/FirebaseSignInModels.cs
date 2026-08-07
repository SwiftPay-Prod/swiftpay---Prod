using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Auth.Shared.Models;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Auth.FirebaseSignIn;

public class FirebaseSignInRequest
{
    /// <summary>Firebase ID token (from the client's auth session).</summary>
    public string IdToken { get; set; } = null!;

    public string? DeviceId { get; set; }
}

public class FirebaseSignInRequestValidator : Validator<FirebaseSignInRequest>
{
    public FirebaseSignInRequestValidator()
    {
        RuleFor(x => x.IdToken)
            .NotEmpty().WithMessage("Token de autenticação é obrigatório");

        RuleFor(x => x.DeviceId)
            .MaximumLength(100).WithMessage("DeviceId inválido")
            .When(x => x.DeviceId != null);
    }
}

public class FirebaseSignInResponse : BaseResponse<FirebaseSignInResponseData>;

public class FirebaseSignInResponseData
{
    /// <summary>
    /// True when the platform account exists but email verification is required
    /// (email/password provider only). When true, <see cref="RequiresEmailVerification"/>.
    /// </summary>
    public bool RequiresEmailVerification { get; set; }

    /// <summary>Auth data (present only when the sign-in succeeded).</summary>
    public AuthResponse? Auth { get; set; }
}

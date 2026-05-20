using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Auth.Shared.Models;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Auth.SignIn;

public class SignInRequest
{
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? DeviceId { get; set; }
}

public class SignInRequestValidator : Validator<SignInRequest>
{
    public SignInRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email é obrigatório")
            .EmailAddress().WithMessage("Email inválido");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha é obrigatória");

        RuleFor(x => x.DeviceId)
            .MaximumLength(100).WithMessage("DeviceId inválido")
            .When(x => x.DeviceId != null);
    }
}

public class SignInResponse : BaseResponse<SignInResponseData>;

/// <summary>
/// Sign in response that can return tokens (success) or require device verification
/// </summary>
public class SignInResponseData
{
    /// <summary>
    /// Whether device verification is required before completing login
    /// </summary>
    public bool RequiresDeviceVerification { get; set; }

    /// <summary>
    /// Auth data (only present when RequiresDeviceVerification is false)
    /// </summary>
    public AuthResponse? Auth { get; set; }

    /// <summary>
    /// Device verification data (only present when RequiresDeviceVerification is true)
    /// </summary>
    public DeviceVerificationInfo? DeviceVerification { get; set; }
}

/// <summary>
/// Information about the device verification process
/// </summary>
public class DeviceVerificationInfo
{
    /// <summary>
    /// Verification ID to be used when verifying the code
    /// </summary>
    public Guid VerificationId { get; set; }

    /// <summary>
    /// Masked email where the code was sent (e.g., "m***@gmail.com")
    /// </summary>
    public string MaskedEmail { get; set; } = null!;

    /// <summary>
    /// When the verification code expires
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Device ID to be stored by the frontend (may be new if not provided)
    /// </summary>
    public string DeviceId { get; set; } = null!;
}


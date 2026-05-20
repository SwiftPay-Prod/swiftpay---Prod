using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.Profile.UpdateProfile;

public sealed class UpdateProfileRequest
{
    public string? Name { get; set; }
    public string? Bio { get; set; }
    public string? SocialLinks { get; set; }
}

public sealed class UpdateProfileRequestValidator : Validator<UpdateProfileRequest>
{
    public UpdateProfileRequestValidator()
    {
        When(x => x.Name != null, () =>
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("O nome não pode ser vazio.")
                .MaximumLength(100).WithMessage("O nome deve ter no máximo 100 caracteres.");
        });

        When(x => x.Bio != null, () =>
        {
            RuleFor(x => x.Bio)
                .MaximumLength(300).WithMessage("A bio deve ter no máximo 300 caracteres.");
        });
    }
}

public sealed class UpdateProfileResponse : BaseResponse<UpdateProfileData>;

public sealed class UpdateProfileData
{
    public string Name { get; set; } = null!;
    public string? Bio { get; set; }
    public string? SocialLinks { get; set; }
}

using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Users.ResetUserPassword;

public sealed class ResetUserPasswordRequest
{
    public Guid UserId { get; set; }
}

public sealed class ResetUserPasswordRequestValidator : Validator<ResetUserPasswordRequest>
{
    public ResetUserPasswordRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório");
    }
}

public sealed class ResetUserPasswordResponse : BaseResponse<ResetUserPasswordData>;

public sealed record ResetUserPasswordData(string TemporaryPassword);

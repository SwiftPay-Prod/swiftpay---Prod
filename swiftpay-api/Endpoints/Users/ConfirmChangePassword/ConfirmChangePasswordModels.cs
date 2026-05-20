using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Users.ConfirmChangePassword;

public sealed class ConfirmChangePasswordRequest
{
    public required string Code { get; set; }
}

public sealed class ConfirmChangePasswordValidator : Validator<ConfirmChangePasswordRequest>
{
    public ConfirmChangePasswordValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("O código de confirmação é obrigatório.")
            .Length(6)
            .WithMessage("O código de confirmação deve ter 6 dígitos.")
            .Matches(@"^\d{6}$")
            .WithMessage("O código de confirmação deve conter apenas números.");
    }
}

public sealed class ConfirmChangePasswordResponse : BaseResponse;

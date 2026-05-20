using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Auth.ResetPassword;

public sealed class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class ResetPasswordResponse : BaseResponse;

public sealed class ResetPasswordValidator : Validator<ResetPasswordRequest>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail é obrigatório.")
            .EmailAddress().WithMessage("E-mail inválido.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Código é obrigatório.")
            .Length(6).WithMessage("Código deve ter 6 dígitos.")
            .Matches(@"^\d{6}$").WithMessage("Código deve conter apenas números.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Nova senha é obrigatória.")
            .MinimumLength(8).WithMessage("Senha deve ter no mínimo 8 caracteres.")
            .Matches(@"[A-Z]").WithMessage("Senha deve conter ao menos uma letra maiúscula.")
            .Matches(@"[a-z]").WithMessage("Senha deve conter ao menos uma letra minúscula.")
            .Matches(@"[0-9]").WithMessage("Senha deve conter ao menos um número.")
            .Matches(@"[\W_]").WithMessage("Senha deve conter ao menos um caractere especial.");
    }
}

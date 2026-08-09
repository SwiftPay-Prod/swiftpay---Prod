using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.ChangePassword;

public sealed class ChangePasswordRequest
{
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
}

public sealed class ChangePasswordValidator : Validator<ChangePasswordRequest>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty()
            .WithMessage("A senha atual é obrigatória.");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("A nova senha é obrigatória.")
            .MinimumLength(8)
            .WithMessage("A nova senha deve ter pelo menos 8 caracteres.")
            .Matches(@"[A-Z]")
            .WithMessage("A nova senha deve conter pelo menos uma letra maiúscula.")
            .Matches(@"[a-z]")
            .WithMessage("A nova senha deve conter pelo menos uma letra minúscula.")
            .Matches(@"[0-9]")
            .WithMessage("A nova senha deve conter pelo menos um número.")
            .Matches(@"[\W_]")
            .WithMessage("A nova senha deve conter pelo menos um caractere especial.")
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("A nova senha deve ser diferente da senha atual.");
    }
}

public sealed class ChangePasswordResponse : BaseResponse<ChangePasswordData>;

public sealed record ChangePasswordData(Guid EmailMessageId, string EmailStatus);

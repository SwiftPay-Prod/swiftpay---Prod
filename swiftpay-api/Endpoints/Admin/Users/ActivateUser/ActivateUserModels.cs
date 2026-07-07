using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.ActivateUser;

public sealed class ActivateUserRequest
{
    public Guid UserId { get; set; }
    public string? Reason { get; set; }
}

public sealed class ActivateUserRequestValidator : Validator<ActivateUserRequest>
{
    public ActivateUserRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório");

        RuleFor(x => x.Reason)
            .MaximumLength(500).WithMessage("Reason deve ter no máximo 500 caracteres");
    }
}

public sealed class ActivateUserResponse : BaseResponse<string>;

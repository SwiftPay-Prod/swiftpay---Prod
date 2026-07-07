using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.InactivateUser;

public sealed class InactivateUserRequest
{
    public Guid UserId { get; set; }
    public string Reason { get; set; } = null!;
}

public sealed class InactivateUserRequestValidator : Validator<InactivateUserRequest>
{
    public InactivateUserRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório");
    }
}

public sealed class InactivateUserResponse : BaseResponse<string>;

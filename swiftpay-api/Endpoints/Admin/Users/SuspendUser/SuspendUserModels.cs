using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.SuspendUser;

public sealed class SuspendUserRequest
{
    public Guid UserId { get; set; }
    public string Reason { get; set; } = null!;
}

public sealed class SuspendUserRequestValidator : Validator<SuspendUserRequest>
{
    public SuspendUserRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório");
    }
}

public sealed class SuspendUserResponse : BaseResponse<string>;

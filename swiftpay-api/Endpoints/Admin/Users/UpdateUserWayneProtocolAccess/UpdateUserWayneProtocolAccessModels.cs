using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.UpdateUserWayneProtocolAccess;

public sealed class UpdateUserWayneProtocolAccessRequest
{
    public Guid UserId { get; set; }
    public bool Enabled { get; set; }
}

public sealed class UpdateUserWayneProtocolAccessRequestValidator : Validator<UpdateUserWayneProtocolAccessRequest>
{
    public UpdateUserWayneProtocolAccessRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório.");
    }
}

public sealed class UpdateUserWayneProtocolAccessResponse : BaseResponse;

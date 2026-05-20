using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Users.SendUserEmailConfirmation;

public sealed class SendUserEmailConfirmationRequest
{
    public Guid UserId { get; set; }
}

public sealed class SendUserEmailConfirmationRequestValidator : Validator<SendUserEmailConfirmationRequest>
{
    public SendUserEmailConfirmationRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário é obrigatório");
    }
}

public sealed class SendUserEmailConfirmationResponse : BaseResponse<string>;

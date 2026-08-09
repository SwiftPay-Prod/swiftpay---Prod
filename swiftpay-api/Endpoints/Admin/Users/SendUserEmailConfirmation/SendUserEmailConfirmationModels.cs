using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.SendUserEmailConfirmation;

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

public sealed class SendUserEmailConfirmationResponse : BaseResponse<SendUserEmailConfirmationData>;

public sealed record SendUserEmailConfirmationData(Guid EmailMessageId, string EmailStatus);

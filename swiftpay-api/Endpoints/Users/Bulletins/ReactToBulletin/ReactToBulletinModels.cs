using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Users.Bulletins.ReactToBulletin;

public sealed class ReactToBulletinRequest
{
    public Guid BulletinId { get; set; }
    public string? Emoji { get; set; }
}

public sealed class ReactToBulletinRequestValidator : Validator<ReactToBulletinRequest>
{
    public ReactToBulletinRequestValidator()
    {
        RuleFor(x => x.BulletinId)
            .NotEmpty()
            .WithMessage("O identificador do informativo é obrigatório.");

        RuleFor(x => x.Emoji)
            .MaximumLength(32)
            .When(x => x.Emoji != null)
            .WithMessage("O emoji é inválido.");
    }
}

public sealed class ReactToBulletinResponse : BaseResponse<ReactToBulletinData>;

public sealed class ReactToBulletinData
{
    public required List<string> UserReactions { get; set; }
    public required Dictionary<string, int> ReactionCounts { get; set; }
}

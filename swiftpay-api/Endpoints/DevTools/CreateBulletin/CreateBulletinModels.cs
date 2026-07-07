using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.DevTools.CreateBulletin;

public sealed class CreateBulletinRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int ExpiresInDays { get; set; } = 7;
}

public sealed class CreateBulletinRequestValidator : Validator<CreateBulletinRequest>
{
    public CreateBulletinRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("O título é obrigatório.")
            .MaximumLength(200).WithMessage("O título deve ter no máximo 200 caracteres.");

        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("O conteúdo é obrigatório.")
            .MaximumLength(2000000).WithMessage("O conteúdo deve ter no máximo 2MB.");

        RuleFor(x => x.ExpiresInDays)
            .InclusiveBetween(1, 365).WithMessage("O prazo de expiração deve ser entre 1 e 365 dias.");
    }
}

public sealed class CreateBulletinResponse : BaseResponse<BulletinData>;

public sealed class BulletinData
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByUserName { get; set; }
}

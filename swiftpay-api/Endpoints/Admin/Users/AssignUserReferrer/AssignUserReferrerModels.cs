using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.AssignUserReferrer;

public sealed class AssignUserReferrerRequest
{
    public Guid UserId { get; set; }
    public Guid ReferrerUserId { get; set; }
    public bool ProcessHistoricalCommission { get; set; }
}

public sealed class AssignUserReferrerRequestValidator : Validator<AssignUserReferrerRequest>
{
    public AssignUserReferrerRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("O identificador do usuário indicado é obrigatório.");

        RuleFor(x => x.ReferrerUserId)
            .NotEmpty().WithMessage("O identificador do gerente de contas é obrigatório.");

        RuleFor(x => x)
            .Must(x => x.UserId != x.ReferrerUserId)
            .WithMessage("O usuário não pode ser vinculado a si mesmo como gerente de contas.");
    }
}

public sealed class AssignUserReferrerResponse : BaseResponse<AssignUserReferrerData>;

public sealed class AssignUserReferrerData
{
    public Guid UserId { get; set; }
    public Guid ReferrerUserId { get; set; }
    public DateTime ReferredAt { get; set; }
    public bool ProcessHistoricalCommission { get; set; }
    public bool IsProcessingAsync { get; set; }
    public int ProcessedPaymentsCount { get; set; }
    public int ProcessedPayoutsCount { get; set; }
}

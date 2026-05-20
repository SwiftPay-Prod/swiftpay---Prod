using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Users.PreviewAssignUserReferrer;

public sealed class PreviewAssignUserReferrerRequest
{
    public Guid UserId { get; set; }
    public Guid ReferrerUserId { get; set; }
}

public sealed class PreviewAssignUserReferrerRequestValidator : Validator<PreviewAssignUserReferrerRequest>
{
    public PreviewAssignUserReferrerRequestValidator()
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

public sealed class PreviewAssignUserReferrerResponse : BaseResponse<PreviewAssignUserReferrerData>;

public sealed class PreviewAssignUserReferrerData
{
    public Guid UserId { get; set; }
    public Guid ReferrerUserId { get; set; }
    public DateTime ReferredAt { get; set; }
    public DateTime ReferralWindowEndAt { get; set; }
    public int ReferralCommissionPercentage { get; set; }
    public int EligiblePaymentsCount { get; set; }
    public int EligiblePayoutsCount { get; set; }
    public long EligibleProfitFromPayments { get; set; }
    public long EligibleProfitFromPayouts { get; set; }
    public long EstimatedCommissionFromPayments { get; set; }
    public long EstimatedCommissionFromPayouts { get; set; }
    public long EstimatedCommissionTotal { get; set; }
}

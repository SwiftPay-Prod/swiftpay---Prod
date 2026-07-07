using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Users.SuspendFromRanking;

public sealed class SuspendFromRankingRequest
{
    public Guid UserId { get; set; }
    public int DurationValue { get; set; }
    public string DurationUnit { get; set; } = null!;
    public string Reason { get; set; } = null!;
}

public sealed class SuspendFromRankingRequestValidator : Validator<SuspendFromRankingRequest>
{
    public SuspendFromRankingRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("UserId é obrigatório.");

        RuleFor(x => x.DurationValue)
            .GreaterThan(0).WithMessage("A duração deve ser maior que zero.");

        RuleFor(x => x.DurationUnit)
            .Must(v => v == "Hours" || v == "Days")
            .WithMessage("DurationUnit deve ser 'Hours' ou 'Days'.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("O motivo é obrigatório.")
            .MaximumLength(500).WithMessage("O motivo deve ter no máximo 500 caracteres.");
    }
}

public sealed class SuspendFromRankingResponse : BaseResponse<string>;

using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Admin.Reconciliations.ApplyCorrections;

public sealed class ApplyCorrectionsRequest
{
    public Guid Id { get; set; }
}

public sealed class ApplyCorrectionsRequestValidator : Validator<ApplyCorrectionsRequest>
{
    public ApplyCorrectionsRequestValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("O identificador da reconciliação é obrigatório.");
    }
}

public sealed class ApplyCorrectionsResponse : BaseResponse<ApplyCorrectionsData>;

public sealed class ApplyCorrectionsData
{
    public Guid Id { get; set; }
    public bool Success { get; set; }
    public int CorrectionsAppliedCount { get; set; }
    public long TotalAmountAdjusted { get; set; }
    public long NewBalance { get; set; }
    public DateTime AppliedAt { get; set; }
}

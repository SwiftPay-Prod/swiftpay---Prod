using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Admin.Reconciliations.StartReconciliation;

public sealed class StartReconciliationRequest
{
    public Guid MerchantId { get; set; }
    public bool SilentMode { get; set; } = false;
}

public sealed class StartReconciliationRequestValidator : Validator<StartReconciliationRequest>
{
    public StartReconciliationRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");
    }
}

public sealed class StartReconciliationResponse : BaseResponse<StartReconciliationData>;

public sealed class StartReconciliationData
{
    public Guid Id { get; set; }
    public Guid MerchantId { get; set; }
    public string Environment { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

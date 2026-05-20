using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Cashouts.SimulateCashout;

public sealed class SimulateCashoutRequest
{
    public Guid MerchantId { get; set; }
    public Guid CashoutId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class SimulateCashoutRequestValidator : Validator<SimulateCashoutRequest>
{
    public SimulateCashoutRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O ID da organização é obrigatório.");

        RuleFor(x => x.CashoutId)
            .NotEmpty().WithMessage("O ID do saque é obrigatório.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("A ação é obrigatória.")
            .Must(BeValidAction).WithMessage("Ação inválida. Use: Complete, Fail ou Reject.");
    }

    private static bool BeValidAction(string action)
    {
        var validActions = new[] { "complete", "fail", "reject" };
        return validActions.Contains(action.ToLower());
    }
}

public sealed class SimulateCashoutResponse : BaseResponse<SimulateCashoutData>;

public sealed class SimulateCashoutData
{
    public Guid Id { get; set; }
    public PayoutStatus Status { get; set; }
    public string SimulatedAction { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public string? EndToEndId { get; set; }
}

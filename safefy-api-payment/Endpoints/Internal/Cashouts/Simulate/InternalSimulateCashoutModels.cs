using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Services.Sandbox;

namespace safefy_api_payment.Endpoints.Internal.Cashouts.Simulate;

public sealed class InternalSimulateCashoutRequest
{
    public Guid CashoutId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class InternalSimulateCashoutRequestValidator : Validator<InternalSimulateCashoutRequest>
{
    public InternalSimulateCashoutRequestValidator()
    {
        RuleFor(x => x.CashoutId).NotEmpty();
        RuleFor(x => x.Action)
            .NotEmpty()
            .Must(BeValidAction).WithMessage("Ação inválida. Use: Complete, Fail ou Reject.");
    }

    private static bool BeValidAction(string action)
    {
        if (string.IsNullOrEmpty(action))
            return false;
        return Enum.TryParse<SimulateCashoutAction>(action, true, out _);
    }
}

public sealed class InternalSimulateCashoutResponse
{
    public InternalSimulateCashoutData? Data { get; set; }
    public InternalSimulateCashoutError? Error { get; set; }
    public string? Message { get; set; }
}

public sealed class InternalSimulateCashoutData
{
    public Guid Id { get; set; }
    public string? Status { get; set; }
    public InternalSimulateCashoutPixData? Pix { get; set; }
}

public sealed class InternalSimulateCashoutPixData
{
    public string? EndToEndId { get; set; }
    public string? AcquirerTransactionId { get; set; }
}

public sealed class InternalSimulateCashoutError
{
    public string? Message { get; set; }
    public string? Code { get; set; }
}

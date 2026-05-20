using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;

namespace safefy_api_payment.Endpoints.Internal.Cashouts.Evaluate;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EvaluateAction
{
    Approve,
    Reject
}

public sealed class EvaluateCashoutRequest
{
    public Guid CashoutId { get; set; }
    public Guid EvaluatedById { get; set; }
    public EvaluateAction Action { get; set; }
    public string? Reason { get; set; }
}

public sealed class EvaluateCashoutRequestValidator : Validator<EvaluateCashoutRequest>
{
    public EvaluateCashoutRequestValidator()
    {
        RuleFor(x => x.CashoutId).NotEmpty();
        RuleFor(x => x.Action).IsInEnum();
        RuleFor(x => x.Reason)
            .NotEmpty()
            .MaximumLength(500)
            .When(x => x.Action == EvaluateAction.Reject)
            .WithMessage("O motivo da rejeição é obrigatório e deve ter no máximo 500 caracteres.");
    }
}

public sealed class EvaluateCashoutResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public string? Status { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

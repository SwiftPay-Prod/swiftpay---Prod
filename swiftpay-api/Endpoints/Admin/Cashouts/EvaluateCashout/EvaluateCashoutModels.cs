using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Admin.Cashouts.EvaluateCashout;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CashoutEvaluateAction
{
    Approve,
    Reject
}

public sealed class EvaluateCashoutRequest
{
    public Guid CashoutId { get; set; }
    public CashoutEvaluateAction Action { get; set; }
    public string? Reason { get; set; }
}

public sealed class EvaluateCashoutRequestValidator : Validator<EvaluateCashoutRequest>
{
    public EvaluateCashoutRequestValidator()
    {
        RuleFor(x => x.CashoutId)
            .NotEmpty()
            .WithMessage("O identificador do saque é obrigatório.");

        RuleFor(x => x.Action)
            .IsInEnum()
            .WithMessage("A ação deve ser 'Approve' ou 'Reject'.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .When(x => x.Action == CashoutEvaluateAction.Reject)
            .WithMessage("O motivo da rejeição é obrigatório.");
    }
}

public sealed class EvaluateCashoutResponse : BaseResponse<EvaluateCashoutData>;

public sealed class EvaluateCashoutData
{
    public Guid Id { get; set; }
    public PayoutStatus Status { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string Message { get; set; } = string.Empty;
}

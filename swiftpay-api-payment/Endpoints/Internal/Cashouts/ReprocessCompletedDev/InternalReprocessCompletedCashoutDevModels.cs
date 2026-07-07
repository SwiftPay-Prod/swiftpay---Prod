using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace swiftpay_api_payment.Endpoints.Internal.Cashouts.ReprocessCompletedDev;

public sealed class InternalReprocessCompletedCashoutDevRequest
{
    public Guid CashoutId { get; set; }
    public Guid MerchantId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public InternalReprocessCashoutStatus TargetStatus { get; set; } = InternalReprocessCashoutStatus.Completed;
}

public enum InternalReprocessCashoutStatus
{
    Completed,
    Failed,
    Rejected,
    Cancelled
}

public sealed class InternalReprocessCompletedCashoutDevRequestValidator : Validator<InternalReprocessCompletedCashoutDevRequest>
{
    public InternalReprocessCompletedCashoutDevRequestValidator()
    {
        RuleFor(x => x.CashoutId)
            .NotEmpty().WithMessage("O ID do saque é obrigatório.");

        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O ID do merchant é obrigatório.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("Status de reprocessamento inválido.");
    }
}

public sealed class InternalReprocessCompletedCashoutDevResponse
{
    public bool Success { get; set; }
    public Guid? CashoutId { get; set; }
    public PayoutStatus? Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? EndToEndId { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace safefy_api_payment.Endpoints.Internal.Transactions.ReprocessCompletedDev;

public sealed class InternalReprocessCompletedTransactionDevRequest
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public InternalReprocessTransactionStatus TargetStatus { get; set; } = InternalReprocessTransactionStatus.Completed;
}

public enum InternalReprocessTransactionStatus
{
    Completed,
    Failed
}

public sealed class InternalReprocessCompletedTransactionDevRequestValidator : Validator<InternalReprocessCompletedTransactionDevRequest>
{
    public InternalReprocessCompletedTransactionDevRequestValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty().WithMessage("O ID da transação é obrigatório.");

        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O ID do merchant é obrigatório.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("Status de reprocessamento inválido.");
    }
}

public sealed class InternalReprocessCompletedTransactionDevResponse
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public PaymentStatus? Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

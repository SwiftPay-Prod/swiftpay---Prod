using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace swiftpay_api.Endpoints.Admin.Transactions.ReprocessCompletedTransactionDev;

public sealed class ReprocessCompletedTransactionDevRequest
{
    public Guid TransactionId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AdminReprocessTransactionTargetStatus TargetStatus { get; set; } = AdminReprocessTransactionTargetStatus.Completed;
}

public enum AdminReprocessTransactionTargetStatus
{
    Completed,
    Failed
}

public sealed class ReprocessCompletedTransactionDevRequestValidator : Validator<ReprocessCompletedTransactionDevRequest>
{
    public ReprocessCompletedTransactionDevRequestValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty()
            .WithMessage("O identificador da transação é obrigatório.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("Status de reprocessamento inválido.");
    }
}

public sealed class ReprocessCompletedTransactionDevResponse : BaseResponse<AdminReprocessCompletedTransactionDevData>;

public sealed class AdminReprocessCompletedTransactionDevData
{
    public Guid Id { get; set; }
    public PaymentStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Message { get; set; } = string.Empty;
}

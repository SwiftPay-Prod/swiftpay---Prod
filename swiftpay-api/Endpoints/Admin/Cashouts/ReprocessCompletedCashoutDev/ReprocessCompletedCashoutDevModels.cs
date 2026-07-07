using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using System.Text.Json.Serialization;

namespace swiftpay_api.Endpoints.Admin.Cashouts.ReprocessCompletedCashoutDev;

public sealed class ReprocessCompletedCashoutDevRequest
{
    public Guid CashoutId { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AdminReprocessCashoutTargetStatus TargetStatus { get; set; } = AdminReprocessCashoutTargetStatus.Completed;
}

public enum AdminReprocessCashoutTargetStatus
{
    Completed,
    Failed,
    Rejected
}

public sealed class ReprocessCompletedCashoutDevRequestValidator : Validator<ReprocessCompletedCashoutDevRequest>
{
    public ReprocessCompletedCashoutDevRequestValidator()
    {
        RuleFor(x => x.CashoutId)
            .NotEmpty()
            .WithMessage("O identificador do saque é obrigatório.");

        RuleFor(x => x.TargetStatus)
            .IsInEnum()
            .WithMessage("Status de reprocessamento inválido.");
    }
}

public sealed class ReprocessCompletedCashoutDevResponse : BaseResponse<AdminReprocessCompletedCashoutDevData>;

public sealed class AdminReprocessCompletedCashoutDevData
{
    public Guid Id { get; set; }
    public PayoutStatus Status { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? EndToEndId { get; set; }
    public string? AcquirerTransactionId { get; set; }
    public string Message { get; set; } = string.Empty;
}

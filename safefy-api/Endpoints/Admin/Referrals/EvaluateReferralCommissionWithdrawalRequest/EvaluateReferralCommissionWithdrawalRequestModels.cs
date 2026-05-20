using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Admin.Referrals.EvaluateReferralCommissionWithdrawalRequest;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ReferralCommissionWithdrawalEvaluateStatus
{
    Reviewed,
    Cancelled
}

public sealed class EvaluateReferralCommissionWithdrawalRequestRequest
{
    public Guid RequestId { get; set; }
    public ReferralCommissionWithdrawalEvaluateStatus Status { get; set; }
    public long? Amount { get; set; }
    public string? Notes { get; set; }
    public string? Reason { get; set; }
    public Guid? ReceiptFileId { get; set; }
}

public sealed class EvaluateReferralCommissionWithdrawalRequestRequestValidator : Validator<EvaluateReferralCommissionWithdrawalRequestRequest>
{
    public EvaluateReferralCommissionWithdrawalRequestRequestValidator()
    {
        RuleFor(x => x.RequestId)
            .NotEmpty().WithMessage("O identificador da solicitação é obrigatório.");

        RuleFor(x => x.Status)
            .IsInEnum()
            .WithMessage("O status deve ser 'Reviewed' ou 'Cancelled'.");

        RuleFor(x => x.Amount)
            .NotNull()
            .When(x => x.Status == ReferralCommissionWithdrawalEvaluateStatus.Reviewed)
            .WithMessage("O valor pago é obrigatório para registrar o pagamento.");

        RuleFor(x => x.Amount!.Value)
            .GreaterThan(0)
            .When(x => x.Status == ReferralCommissionWithdrawalEvaluateStatus.Reviewed && x.Amount.HasValue)
            .WithMessage("O valor pago deve ser maior que zero.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .When(x => x.Status == ReferralCommissionWithdrawalEvaluateStatus.Cancelled)
            .WithMessage("O motivo da rejeição é obrigatório.");

        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Reason))
            .WithMessage("O motivo da rejeição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.Notes)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Notes))
            .WithMessage("As observações devem ter no máximo 500 caracteres.");
    }
}

public sealed class EvaluateReferralCommissionWithdrawalRequestResponse : BaseResponse<EvaluateReferralCommissionWithdrawalRequestData>;

public sealed class EvaluateReferralCommissionWithdrawalRequestData
{
    public Guid RequestId { get; set; }
    public Guid ReferrerUserId { get; set; }
    public ReferralCommissionWithdrawalRequestStatus Status { get; set; }
    public Guid? PaymentId { get; set; }
    public long PaidAmount { get; set; }
    public long ReleasedAmount { get; set; }
    public long AvailableCommissionBalance { get; set; }
    public long PendingWithdrawalRequestsTotal { get; set; }
    public string? Reason { get; set; }
}

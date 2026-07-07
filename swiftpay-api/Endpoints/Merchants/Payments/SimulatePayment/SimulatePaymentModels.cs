using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Payments.SimulatePayment;

public sealed class SimulatePaymentRequest
{
    public Guid MerchantId { get; set; }
    public Guid PaymentId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class SimulatePaymentRequestValidator : Validator<SimulatePaymentRequest>
{
    public SimulatePaymentRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O ID da organização é obrigatório.");

        RuleFor(x => x.PaymentId)
            .NotEmpty().WithMessage("O ID do pagamento é obrigatório.");

        RuleFor(x => x.Action)
            .NotEmpty().WithMessage("A ação é obrigatória.")
            .Must(BeValidAction).WithMessage("Ação inválida. Use: complete, expire, fail ou refund.");
    }

    private static bool BeValidAction(string action)
    {
        var validActions = new[] { "complete", "expire", "fail", "refund" };
        return validActions.Contains(action.ToLower());
    }
}

public sealed class SimulatePaymentResponse : BaseResponse<SimulatePaymentData>;

public sealed class SimulatePaymentData
{
    public Guid Id { get; set; }
    public PaymentStatus Status { get; set; }
    public string SimulatedAction { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
}

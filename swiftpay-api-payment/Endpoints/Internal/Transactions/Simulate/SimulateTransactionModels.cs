using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Internal.Transactions.Simulate;

public sealed class InternalSimulateTransactionRequest
{
    public Guid TransactionId { get; set; }
    public Guid MerchantId { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class InternalSimulateTransactionRequestValidator : Validator<InternalSimulateTransactionRequest>
{
    public InternalSimulateTransactionRequestValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty().WithMessage("O ID da transação é obrigatório.");

        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O ID do merchant é obrigatório.");

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

public sealed class InternalSimulateTransactionResponse : BaseResponse<InternalSimulateTransactionData>;

public sealed class InternalSimulateTransactionData
{
    public bool Success { get; set; }
    public Guid TransactionId { get; set; }
    public PaymentStatus Status { get; set; }
    public string SimulatedAction { get; set; } = string.Empty;
    public DateTime? CompletedAt { get; set; }
    public DateTime? RefundedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Transactions.Create;
using safefy_api_payment.Interfaces;

namespace safefy_api_payment.Endpoints.Transactions.Simulate;

/// <summary>
/// Request para simular uma transação.
/// </summary>
public sealed class SimulateTransactionRequest
{
    /// <summary>
    /// ID da transação.
    /// </summary>
    public Guid TransactionId { get; set; }

    /// <summary>
    /// Ação a simular: complete, expire, fail, refund.
    /// </summary>
    public string Action { get; set; } = string.Empty;
}

/// <summary>
/// Validador do request de simulação.
/// </summary>
public sealed class SimulateTransactionRequestValidator : Validator<SimulateTransactionRequest>
{
    public SimulateTransactionRequestValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty().WithMessage("O ID da transação é obrigatório.");

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

/// <summary>
/// Response da simulação de transação.
/// </summary>
public sealed class SimulateTransactionResponse : BaseResponse<TransactionSimulationData>;

/// <summary>
/// Dados da transação após simulação.
/// </summary>
public sealed class TransactionSimulationData
{
    /// <summary>
    /// ID da transação.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Novo status da transação.
    /// </summary>
    public PaymentStatus Status { get; set; }

    /// <summary>
    /// Ação que foi simulada.
    /// </summary>
    public string SimulatedAction { get; set; } = string.Empty;

    /// <summary>
    /// Data de conclusão (se aplicável).
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Data de estorno (se aplicável).
    /// </summary>
    public DateTime? RefundedAt { get; set; }

    /// <summary>
    /// Dados específicos do PIX (se aplicável).
    /// </summary>
    public PixTransactionData? Pix { get; set; }
}

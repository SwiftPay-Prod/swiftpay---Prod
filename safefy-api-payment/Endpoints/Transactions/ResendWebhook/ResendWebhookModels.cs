using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Transactions.ResendWebhook;

/// <summary>
/// Request para reenviar webhook de uma transação.
/// </summary>
public sealed class ResendWebhookRequest
{
    /// <summary>
    /// ID da transação.
    /// </summary>
    public Guid TransactionId { get; set; }
}

/// <summary>
/// Validador do request de reenvio de webhook.
/// </summary>
public sealed class ResendWebhookRequestValidator : Validator<ResendWebhookRequest>
{
    public ResendWebhookRequestValidator()
    {
        RuleFor(x => x.TransactionId)
            .NotEmpty()
            .WithMessage("O identificador da transação é obrigatório.");
    }
}

/// <summary>
/// Response do reenvio de webhook.
/// </summary>
public sealed class ResendWebhookResponse : BaseResponse;

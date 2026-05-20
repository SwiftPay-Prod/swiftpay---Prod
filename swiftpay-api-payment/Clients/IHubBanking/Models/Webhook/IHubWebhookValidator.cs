using FastEndpoints;
using FluentValidation;

namespace safefy_api_payment.Clients.IHubBanking.Models.Webhook;

public sealed class IHubWebhookRequestValidator : Validator<IHubWebhookRequest>
{
    public IHubWebhookRequestValidator()
    {
        RuleFor(x => x.Event)
            .Must(e => e != IHubWebhookEventType.Unknown)
            .WithMessage("O evento informado é inválido.");

        RuleFor(x => x.Payload)
            .NotNull().WithMessage("O payload é obrigatório.");

        RuleFor(x => x.Payload)
            .Must(p => !string.IsNullOrEmpty(p.TransactionId) || !string.IsNullOrEmpty(p.WithdrawalId))
            .WithMessage("É necessário informar transaction_id ou withdrawal_id.");
    }
}

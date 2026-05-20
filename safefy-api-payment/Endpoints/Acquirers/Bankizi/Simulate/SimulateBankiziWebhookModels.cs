using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Clients.Bankizi.Models.Webhook;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Acquirers.Bankizi.Simulate;

/// <summary>
/// Request para simular webhook da Bankizi.
/// Usa o mesmo formato do payload real enviado pela Bankizi.
/// Disponível apenas em ambiente de desenvolvimento (localhost).
/// </summary>
public sealed record SimulateBankiziWebhookRequest : BankiziPixInWebhook;

/// <summary>
/// Validador do request de simulação de webhook.
/// </summary>
public sealed class SimulateBankiziWebhookRequestValidator : Validator<SimulateBankiziWebhookRequest>
{
    public SimulateBankiziWebhookRequestValidator()
    {
        RuleFor(x => x.Event)
            .NotEmpty().WithMessage("O evento é obrigatório.")
            .Equal("PIX_IN").WithMessage("O evento deve ser 'PIX_IN'.");

        RuleFor(x => x.Data)
            .NotNull().WithMessage("Os dados são obrigatórios.");

        RuleFor(x => x.Data.TxId)
            .NotEmpty().WithMessage("O TxId é obrigatório.")
            .Length(26).WithMessage("O TxId deve ter 26 caracteres.");

        RuleFor(x => x.Data.Status)
            .IsInEnum().WithMessage("Status inválido.");

        RuleFor(x => x.Data.PayerInfo!.Document)
            .Matches(@"^\d{11}$|^\d{14}$")
            .When(x => x.Data.PayerInfo != null && !string.IsNullOrEmpty(x.Data.PayerInfo.Document))
            .WithMessage("O documento deve ser um CPF (11 dígitos) ou CNPJ (14 dígitos).");

        RuleFor(x => x.Data.AmountRefunded)
            .GreaterThan(0)
            .When(x => x.Data.AmountRefunded.HasValue)
            .WithMessage("O valor reembolsado deve ser maior que zero.");

        RuleFor(x => x.Data.AmountRefunded)
            .NotNull()
            .When(x => x.Data.Status == BankiziPixStatus.Refunded || x.Data.Status == BankiziPixStatus.PartiallyRefunded)
            .WithMessage("O valor reembolsado é obrigatório para status de reembolso.");
    }
}

/// <summary>
/// Response da simulação de webhook.
/// </summary>
public sealed class SimulateBankiziWebhookResponse : BaseResponse<SimulateBankiziWebhookData>;

/// <summary>
/// Dados da simulação de webhook.
/// </summary>
public sealed class SimulateBankiziWebhookData
{
    /// <summary>
    /// TxId da transação.
    /// </summary>
    public string TxId { get; set; } = string.Empty;

    /// <summary>
    /// Status simulado.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Indica se o webhook foi processado com sucesso.
    /// </summary>
    public bool Processed { get; set; }
}

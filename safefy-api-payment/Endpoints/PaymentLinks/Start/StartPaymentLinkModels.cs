using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.PaymentLinks.Get;

namespace safefy_api_payment.Endpoints.PaymentLinks.Start;

public sealed class StartPaymentLinkRequest
{
    public string Token { get; set; } = string.Empty;
    public PaymentMethod Method { get; set; }
    public string? BuyerName { get; set; }
    public string? BuyerEmail { get; set; }
    public string? BuyerPhone { get; set; }
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public int? CardExpirationMonth { get; set; }
    public int? CardExpirationYear { get; set; }
    public int? Installments { get; set; }
    public string? CardCvv { get; set; }
}

public sealed class StartPaymentLinkRequestValidator : Validator<StartPaymentLinkRequest>
{
    public StartPaymentLinkRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty()
            .WithMessage("Token do link de pagamento é obrigatório.");

        RuleFor(x => x.Method)
            .Must(method => method == PaymentMethod.Pix || method == PaymentMethod.Boleto || method == PaymentMethod.CreditCard)
            .WithMessage("Método de pagamento inválido para este link.");

        RuleFor(x => x.CardNumber)
            .NotEmpty()
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O número do cartão é obrigatório para pagamentos com cartão.");

        RuleFor(x => x.CardHolderName)
            .NotEmpty()
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O nome impresso no cartão é obrigatório para pagamentos com cartão.");

        RuleFor(x => x.CardExpirationMonth)
            .InclusiveBetween(1, 12)
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O mês de expiração do cartão deve ser entre 1 e 12.");

        RuleFor(x => x.CardExpirationYear)
            .Must(BeValidCardExpirationYear)
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O ano de expiração do cartão é inválido.");

        RuleFor(x => x.Installments)
            .NotNull()
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O número de parcelas é obrigatório para pagamentos com cartão.")
            .DependentRules(() =>
            {
                RuleFor(x => x.Installments)
                    .InclusiveBetween(1, 12)
                    .When(x => x.Method == PaymentMethod.CreditCard && x.Installments.HasValue)
                    .WithMessage("O número de parcelas deve ser entre 1 e 12.");
            });

        RuleFor(x => x.CardCvv)
            .NotEmpty()
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O CVV do cartão é obrigatório para pagamentos com cartão.");
    }

    private static bool BeValidCardExpirationYear(int? year)
    {
        if (!year.HasValue)
        {
            return false;
        }

        var normalizedYear = year.Value < 100 ? 2000 + year.Value : year.Value;
        var currentYear = DateTime.UtcNow.Year;
        return normalizedYear >= currentYear && normalizedYear <= currentYear + 30;
    }
}

public sealed class StartPaymentLinkResponse : BaseResponse<PaymentLinkData>;

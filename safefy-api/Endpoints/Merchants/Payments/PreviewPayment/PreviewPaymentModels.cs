using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Calculation;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Payments.PreviewPayment;

public sealed class PreviewPaymentRequest
{
    public Guid MerchantId { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Pix;
    public PaymentFeeContext FeeContext { get; set; } = PaymentFeeContext.Api;
    public long Amount { get; set; }
    public int? Installments { get; set; }
}

public sealed class PreviewPaymentRequestValidator : Validator<PreviewPaymentRequest>
{
    public PreviewPaymentRequestValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("O valor da transação deve ser maior que zero.");

        RuleFor(x => x.Method)
            .Must(method => Enum.IsDefined(method))
            .WithMessage("O método de pagamento é inválido.");

        RuleFor(x => x.FeeContext)
            .Must(feeContext => Enum.IsDefined(feeContext))
            .WithMessage("O contexto da taxa é inválido.");

        RuleFor(x => x.Installments)
            .InclusiveBetween(1, 12)
            .When(x => x.Method == PaymentMethod.CreditCard && x.Installments.HasValue)
            .WithMessage("A quantidade de parcelas deve estar entre 1 e 12.");
    }
}

public sealed class PreviewPaymentResponse : BaseResponse<PreviewPaymentData>;

public sealed class PreviewPaymentData
{
    public long Amount { get; set; }
    public long Fee { get; set; }
    public long NetAmount { get; set; }
}

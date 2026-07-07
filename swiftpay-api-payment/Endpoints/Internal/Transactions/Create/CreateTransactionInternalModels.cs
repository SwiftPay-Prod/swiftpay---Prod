using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api_payment.Endpoints.Internal.Transactions.Create;

/// <summary>
/// Request interno para criar transação (usado pelo checkout/order).
/// Apenas informações de pagamento - produtos, cupons e items ficam no Order.
/// </summary>
public sealed class CreateTransactionInternalRequest
{
    public Guid MerchantId { get; set; }
    public Guid UserId { get; set; }
    public PaymentMethod Method { get; set; }
    public long Amount { get; set; }
    public CurrencyType Currency { get; set; }
    public string? Description { get; set; }
    public string? ExternalId { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CallbackUrl { get; set; }
    public string? Metadata { get; set; }
    public int? PixExpirationMinutes { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerDocument { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CardNumber { get; set; }
    public string? CardHolderName { get; set; }
    public int? CardExpirationMonth { get; set; }
    public int? CardExpirationYear { get; set; }
    public int? Installments { get; set; }
    public string? CardCvv { get; set; }
    public DateTime? BoletoDueDate { get; set; }
    public string? BoletoInstructions { get; set; }
}

public sealed class CreateTransactionInternalRequestValidator : Validator<CreateTransactionInternalRequest>
{
    public CreateTransactionInternalRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
        RuleFor(x => x.Description).MaximumLength(500);

        RuleFor(x => x.BoletoDueDate)
            .NotNull()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto e obrigatoria.")
            .DependentRules(() =>
            {
                RuleFor(x => x.BoletoDueDate)
                    .Must(dueDate => dueDate.HasValue && dueDate.Value.Date >= DateTime.UtcNow.Date.AddDays(2))
                    .When(x => x.Method == PaymentMethod.Boleto && x.BoletoDueDate.HasValue)
                    .WithMessage("A data de vencimento do boleto deve ser no minimo D+2.");
            });

        RuleFor(x => x.BoletoDueDate)
            .Null()
            .When(x => x.Method != PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto so pode ser informada para pagamentos com boleto.");
    }
}

public sealed class CreateTransactionInternalResponse
{
    public bool Success { get; set; }
    public Guid? TransactionId { get; set; }
    public string? ExternalId { get; set; }
    public string? Method { get; set; }
    public long? Amount { get; set; }
    public long? Fee { get; set; }
    public long? NetAmount { get; set; }
    public string? Currency { get; set; }
    public string? Status { get; set; }
    public string? Description { get; set; }
    public string? Environment { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public Guid? CustomerId { get; set; }
    public CreateTransactionInternalPixData? Pix { get; set; }
    public CreateTransactionInternalBoletoData? Boleto { get; set; }
    public string? ErrorMessage { get; set; }
    public string? ErrorCode { get; set; }
}

public sealed class CreateTransactionInternalPixData
{
    public string? TxId { get; set; }
    public string? QrCode { get; set; }
    public string? CopyAndPaste { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class CreateTransactionInternalBoletoData
{
    public string? Barcode { get; set; }
    public string? DigitableLine { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? DueDate { get; set; }
}

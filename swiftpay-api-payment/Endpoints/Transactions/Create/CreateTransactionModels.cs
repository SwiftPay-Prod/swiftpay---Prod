using FastEndpoints;
using FluentValidation;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Transactions.Create;

/// <summary>
/// Request para criar uma transação simples (gateway).
/// Para e-commerce com produtos, cupons e itens, use a API de Orders.
/// </summary>
public sealed class CreateTransactionRequest
{
    /// <summary>
    /// Método de pagamento: pix, credit_card ou boleto.
    /// </summary>
    public PaymentMethod Method { get; set; }

    /// <summary>
    /// Valor em centavos. Exemplo: R$ 10,00 = 1000
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// Moeda (padrão: BRL).
    /// </summary>
    public CurrencyType Currency { get; set; }

    /// <summary>
    /// Descrição da transação.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// ID externo para referência no seu sistema.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// ID do cliente (opcional).
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// URL de callback para notificações.
    /// </summary>
    public string? CallbackUrl { get; set; }

    /// <summary>
    /// Metadados adicionais em JSON.
    /// </summary>
    public string? Metadata { get; set; }

    #region PIX Specific

    /// <summary>
    /// Tempo de expiração do PIX em minutos (padrão: 30).
    /// </summary>
    public int? PixExpirationMinutes { get; set; }

    /// <summary>
    /// Nome do cliente/pagador.
    /// Se <see cref="CustomerId"/> não for informado e este campo estiver preenchido,
    /// a API irá criar um cliente e vincular a transação ao <see cref="CustomerId"/>.
    /// </summary>
    public string? CustomerName { get; set; }

    /// <summary>
    /// CPF/CNPJ do cliente/pagador.
    /// </summary>
    public string? CustomerDocument { get; set; }

    /// <summary>
    /// Email do cliente/pagador (opcional).
    /// </summary>
    public string? CustomerEmail { get; set; }

    /// <summary>
    /// Telefone do cliente/pagador (opcional).
    /// </summary>
    public string? CustomerPhone { get; set; }

    #endregion

    #region Credit Card Specific

    /// <summary>
    /// Número do cartão.
    /// </summary>
    public string? CardNumber { get; set; }

    /// <summary>
    /// Nome impresso no cartão.
    /// </summary>
    public string? CardHolderName { get; set; }

    /// <summary>
    /// Mês de expiração do cartão.
    /// </summary>
    public int? CardExpirationMonth { get; set; }

    /// <summary>
    /// Ano de expiração do cartão.
    /// </summary>
    public int? CardExpirationYear { get; set; }

    /// <summary>
    /// Número de parcelas (1-12).
    /// </summary>
    public int? Installments { get; set; }

    /// <summary>
    /// CVV do cartão.
    /// </summary>
    public string? CardCvv { get; set; }

    #endregion

    #region Boleto Specific

    /// <summary>
    /// Data de vencimento do boleto.
    /// </summary>
    public DateTime? BoletoDueDate { get; set; }

    /// <summary>
    /// Instruções do boleto.
    /// </summary>
    public string? BoletoInstructions { get; set; }

    #endregion

}

/// <summary>
/// Validador do request de criação de transação.
/// </summary>
public sealed class CreateTransactionRequestValidator : Validator<CreateTransactionRequest>
{
    public CreateTransactionRequestValidator()
    {
        RuleFor(x => x.Method)
            .Must(BeValidMethod)
            .WithMessage("Método inválido. Use: pix, credit_card ou boleto.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("O valor deve ser maior que zero.");

        RuleFor(x => x.Currency)
            .Must(x => x == CurrencyType.BRL).WithMessage("Apenas BRL é suportado no momento.");

        RuleFor(x => x.ExternalId)
            .MaximumLength(100).WithMessage("O ID externo deve ter no máximo 100 caracteres.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição deve ter no máximo 500 caracteres.");

        RuleFor(x => x.CallbackUrl)
            .Must(BeValidUrl).When(x => !string.IsNullOrEmpty(x.CallbackUrl))
            .WithMessage("A URL de callback deve ser válida.");

        RuleFor(x => x.PixExpirationMinutes)
            .InclusiveBetween(5, 1440)
            .When(x => x.Method == PaymentMethod.Pix && x.PixExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração do PIX deve ser entre 5 minutos e 24 horas.");

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

        RuleFor(x => x.CardCvv)
            .NotEmpty()
            .When(x => x.Method == PaymentMethod.CreditCard)
            .WithMessage("O CVV do cartão é obrigatório para pagamentos com cartão.");

        RuleFor(x => x.Installments)
            .InclusiveBetween(1, 12)
            .When(x => x.Method == PaymentMethod.CreditCard && x.Installments.HasValue)
            .WithMessage("O número de parcelas deve ser entre 1 e 12.");

        RuleFor(x => x.BoletoDueDate)
            .NotNull()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto é obrigatória.")
            .DependentRules(() =>
            {
                RuleFor(x => x.BoletoDueDate)
                    .Must(dueDate => dueDate.HasValue && dueDate.Value.Date >= DateTime.UtcNow.Date.AddDays(2))
                    .When(x => x.Method == PaymentMethod.Boleto && x.BoletoDueDate.HasValue)
                    .WithMessage("A data de vencimento do boleto deve ser no mínimo D+2.");
            });

        RuleFor(x => x.BoletoDueDate)
            .Null()
            .When(x => x.Method != PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto só pode ser informada para pagamentos com boleto.");

        RuleFor(x => x.CustomerName)
            .NotEmpty()
            .When(x => x.CustomerId == null &&
                       (x.Method == PaymentMethod.Boleto ||
                        !string.IsNullOrWhiteSpace(x.CustomerDocument) ||
                        !string.IsNullOrWhiteSpace(x.CustomerEmail)))
            .WithMessage("O nome do cliente é obrigatório quando customerId não é informado.");

        RuleFor(x => x.CustomerEmail)
            .EmailAddress()
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerEmail))
            .WithMessage("O email do cliente deve ser válido.");

        RuleFor(x => x.CustomerPhone)
            .Must(BeValidPhone)
            .When(x => !string.IsNullOrWhiteSpace(x.CustomerPhone))
            .WithMessage("O telefone do cliente deve ser válido.");

        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .When(x => x.Method == PaymentMethod.Boleto && string.IsNullOrWhiteSpace(x.CustomerName))
            .WithMessage("O cliente é obrigatório para boleto. Informe customerId ou customerName.");

    }

    private static bool BeValidMethod(PaymentMethod method)
    {
        return Enum.IsDefined(method);
    }

    private static bool BeValidUrl(string? url)
    {
        if (string.IsNullOrEmpty(url)) return true;
        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
            && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }

    private static bool BeValidPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return true;

        var digits = SanitizeUtils.SanitizePhone(phone);
        if (string.IsNullOrEmpty(digits)) return false;

        return digits.Length is >= 10 and <= 15;
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

/// <summary>
/// Response da criação de transação.
/// </summary>
public sealed class CreateTransactionResponse : BaseResponse<TransactionData>;

/// <summary>
/// Dados da transação criada (gateway simples).
/// </summary>
public sealed class TransactionData
{
    /// <summary>
    /// ID da transação.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// ID externo.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Método de pagamento.
    /// </summary>
    public PaymentMethod Method { get; set; }

    /// <summary>
    /// Valor em centavos.
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// Taxa em centavos.
    /// </summary>
    public long Fee { get; set; }

    /// <summary>
    /// Valor líquido em centavos.
    /// </summary>
    public long NetAmount { get; set; }

    /// <summary>
    /// Moeda.
    /// </summary>
    public string Currency { get; set; } = "BRL";

    /// <summary>
    /// Status da transação.
    /// </summary>
    public PaymentStatus Status { get; set; }

    /// <summary>
    /// Descrição.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Ambiente: Sandbox ou Production.
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Data de expiração.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Data de criação.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Data de conclusão.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// ID do cliente (se vinculado).
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// ID do pedido (se for transação via e-commerce/checkout).
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// Dados específicos do PIX (se aplicável).
    /// </summary>
    public PixTransactionData? Pix { get; set; }

    /// <summary>
    /// Dados específicos do boleto (se aplicável).
    /// </summary>
    public BoletoTransactionData? Boleto { get; set; }

}

/// <summary>
/// Dados específicos de PIX.
/// </summary>
public sealed class PixTransactionData
{
    /// <summary>
    /// TxId do PIX.
    /// </summary>
    public string? TxId { get; set; }

    /// <summary>
    /// QR Code em base64.
    /// </summary>
    public string? QrCode { get; set; }

    /// <summary>
    /// Código copia e cola.
    /// </summary>
    public string? CopyAndPaste { get; set; }

    /// <summary>
    /// Data de expiração do QR Code.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Dados específicos de boleto.
/// </summary>
public sealed class BoletoTransactionData
{
    /// <summary>
    /// Código de barras.
    /// </summary>
    public string? Barcode { get; set; }

    /// <summary>
    /// Linha digitável.
    /// </summary>
    public string? DigitableLine { get; set; }

    /// <summary>
    /// URL do PDF do boleto.
    /// </summary>
    public string? PdfUrl { get; set; }

    /// <summary>
    /// Nome do beneficiario/destinatario do boleto.
    /// </summary>
    public string? RecipientName { get; set; }

    /// <summary>
    /// Documento do beneficiario/destinatario do boleto.
    /// </summary>
    public string? RecipientDocument { get; set; }

    /// <summary>
    /// Nome do pagador do boleto.
    /// </summary>
    public string? PayerName { get; set; }

    /// <summary>
    /// Documento do pagador do boleto.
    /// </summary>
    public string? PayerDocument { get; set; }

    /// <summary>
    /// Codigo PIX copia e cola vinculado ao boleto (quando disponivel).
    /// </summary>
    public string? PixCopyAndPaste { get; set; }

    /// <summary>
    /// Data de expiracao do PIX vinculado ao boleto (quando disponivel).
    /// </summary>
    public DateTime? PixExpiresAt { get; set; }

    /// <summary>
    /// Data de vencimento.
    /// </summary>
    public DateTime? DueDate { get; set; }
}

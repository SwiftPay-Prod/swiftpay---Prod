using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.CreateOrder;

/// <summary>
/// Request para criar pedido via checkout.
/// </summary>
public sealed class CreateOrderRequest
{
    /// <summary>
    /// ShortId do checkout (na URL).
    /// </summary>
    public string ShortId { get; set; } = string.Empty;

    /// <summary>
    /// ID do pedido existente (se já foi reservado via reserve endpoint).
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// Método de pagamento: pix, credit_card ou boleto.
    /// </summary>
    public PaymentMethod Method { get; set; }

    /// <summary>
    /// Itens do checkout (obrigatório para templates Catalog, calculado automaticamente para SingleOrder).
    /// </summary>
    public List<CheckoutItemRequest>? Items { get; set; }

    /// <summary>
    /// Código do cupom de desconto (opcional).
    /// </summary>
    public string? CouponCode { get; set; }

    /// <summary>
    /// Dados do cliente.
    /// </summary>
    public CheckoutCustomerRequest? Customer { get; set; }

    /// <summary>
    /// Endereço do cliente (se RequireCustomerAddress).
    /// </summary>
    public CheckoutAddressRequest? Address { get; set; }

    /// <summary>
    /// Tempo de expiração do PIX em minutos (se não informado, usa o padrão do checkout).
    /// </summary>
    public int? PixExpirationMinutes { get; set; }

    /// <summary>
    /// Data de vencimento do boleto.
    /// </summary>
    public DateTime? BoletoDueDate { get; set; }

    /// <summary>
    /// Instruções do boleto.
    /// </summary>
    public string? BoletoInstructions { get; set; }
}

/// <summary>
/// Item do checkout.
/// </summary>
public sealed class CheckoutItemRequest
{
    /// <summary>
    /// ID do produto.
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// ID da variante (opcional).
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Quantidade.
    /// </summary>
    public int Quantity { get; set; } = 1;
}

/// <summary>
/// Dados do cliente para o checkout.
/// </summary>
public sealed class CheckoutCustomerRequest
{
    /// <summary>
    /// Nome do cliente.
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Email do cliente.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Telefone do cliente.
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// CPF ou CNPJ do cliente.
    /// </summary>
    public string? Document { get; set; }
}

/// <summary>
/// Endereço do cliente.
/// </summary>
public sealed class CheckoutAddressRequest
{
    /// <summary>
    /// CEP.
    /// </summary>
    public string? ZipCode { get; set; }

    /// <summary>
    /// Logradouro.
    /// </summary>
    public string? Street { get; set; }

    /// <summary>
    /// Número.
    /// </summary>
    public string? Number { get; set; }

    /// <summary>
    /// Complemento.
    /// </summary>
    public string? Complement { get; set; }

    /// <summary>
    /// Bairro.
    /// </summary>
    public string? Neighborhood { get; set; }

    /// <summary>
    /// Cidade.
    /// </summary>
    public string? City { get; set; }

    /// <summary>
    /// Estado.
    /// </summary>
    public string? State { get; set; }
}

/// <summary>
/// Validador do request de criação de pedido via checkout.
/// </summary>
public sealed class CreateOrderRequestValidator : Validator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.Method)
            .IsInEnum().WithMessage("Método de pagamento inválido.");

        RuleForEach(x => x.Items)
            .ChildRules(item =>
            {
                item.RuleFor(i => i.ProductId)
                    .NotEmpty()
                    .WithMessage("O produto é obrigatório.");

                item.RuleFor(i => i.Quantity)
                    .GreaterThan(0)
                    .WithMessage("A quantidade deve ser maior que zero.");
            })
            .When(x => x.Items != null && x.Items.Count > 0);

        RuleFor(x => x.Customer!.Name)
            .MaximumLength(200).WithMessage("O nome deve ter no máximo 200 caracteres.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Name));

        RuleFor(x => x.Customer!.Email)
            .EmailAddress().WithMessage("O email deve ser válido.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Email));

        RuleFor(x => x.Customer!.Phone)
            .MaximumLength(20).WithMessage("O telefone deve ter no máximo 20 caracteres.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Phone));

        RuleFor(x => x.Customer!.Document)
            .MaximumLength(20).WithMessage("O documento deve ter no máximo 20 caracteres.")
            .When(x => x.Customer != null && !string.IsNullOrEmpty(x.Customer.Document));

        RuleFor(x => x.Address)
            .NotNull()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("O endereço é obrigatório para boleto.");

        RuleFor(x => x.Address!.Street)
            .NotEmpty().WithMessage("O logradouro é obrigatório para boleto.")
            .When(x => x.Method == PaymentMethod.Boleto);

        RuleFor(x => x.Address!.Number)
            .NotEmpty().WithMessage("O número é obrigatório para boleto.")
            .When(x => x.Method == PaymentMethod.Boleto);

        RuleFor(x => x.Address!.Neighborhood)
            .NotEmpty().WithMessage("O bairro é obrigatório para boleto.")
            .When(x => x.Method == PaymentMethod.Boleto);

        RuleFor(x => x.Address!.City)
            .NotEmpty().WithMessage("A cidade é obrigatória para boleto.")
            .When(x => x.Method == PaymentMethod.Boleto);

        RuleFor(x => x.Address!.State)
            .NotEmpty().WithMessage("O estado é obrigatório para boleto.")
            .When(x => x.Method == PaymentMethod.Boleto);

        RuleFor(x => x.Address!.ZipCode)
            .NotEmpty().WithMessage("O CEP é obrigatório para boleto.")
            .When(x => x.Method == PaymentMethod.Boleto);

        RuleFor(x => x.PixExpirationMinutes)
            .InclusiveBetween(5, 1440)
            .When(x => x.PixExpirationMinutes.HasValue)
            .WithMessage("O tempo de expiração do PIX deve ser entre 5 minutos e 24 horas.");

        RuleFor(x => x.BoletoDueDate)
            .NotNull()
            .When(x => x.Method == PaymentMethod.Boleto)
            .WithMessage("A data de vencimento do boleto é obrigatória.")
            .DependentRules(() =>
            {
                RuleFor(x => x.BoletoDueDate)
                    .GreaterThan(DateTime.Today)
                    .WithMessage("A data de vencimento do boleto deve ser futura.");
            });
    }
}

/// <summary>
/// Response da criação de pedido via checkout.
/// </summary>
public sealed class CreateOrderResponse : BaseResponse<OrderData>;

/// <summary>
/// Dados do pedido criado.
/// </summary>
public sealed class OrderData
{
    /// <summary>
    /// ID do pedido.
    /// </summary>
    public Guid OrderId { get; set; }

    /// <summary>
    /// Número do pedido (ex: ORD-20250125-0001-12).
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// ID do pagamento.
    /// </summary>
    public Guid PaymentId { get; set; }

    /// <summary>
    /// ID externo do pagamento.
    /// </summary>
    public string? ExternalId { get; set; }

    /// <summary>
    /// Método de pagamento.
    /// </summary>
    public PaymentMethod Method { get; set; }

    /// <summary>
    /// Valor total em centavos.
    /// </summary>
    public long Amount { get; set; }

    /// <summary>
    /// Taxa da plataforma em centavos.
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
    /// Status do pagamento.
    /// </summary>
    public PaymentStatus Status { get; set; }

    /// <summary>
    /// Descrição.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Ambiente.
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
    /// ID do cliente.
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// Dados do PIX (se método for PIX).
    /// </summary>
    public PixOrderData? Pix { get; set; }

    /// <summary>
    /// Dados do boleto (se método for boleto).
    /// </summary>
    public BoletoOrderData? Boleto { get; set; }
}

/// <summary>
/// Dados do PIX no pedido.
/// </summary>
public sealed class PixOrderData
{
    /// <summary>
    /// ID da transação PIX.
    /// </summary>
    public string? TxId { get; set; }

    /// <summary>
    /// QR Code em base64.
    /// </summary>
    public string? QrCode { get; set; }

    /// <summary>
    /// Código PIX copia e cola.
    /// </summary>
    public string? CopyAndPaste { get; set; }

    /// <summary>
    /// Data de expiração do PIX.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}

/// <summary>
/// Dados do boleto no pedido.
/// </summary>
public sealed class BoletoOrderData
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
    /// Data de vencimento.
    /// </summary>
    public DateTime? DueDate { get; set; }
}

using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Endpoints.Transactions.Create;
using safefy_api_payment.Validators;

namespace safefy_api_payment.Endpoints.Transactions.List;

/// <summary>
/// Request para listar transações.
/// </summary>
public sealed class ListTransactionsRequest : IPaginatedRequest
{
    /// <summary>
    /// Número da página (padrão: 1).
    /// </summary>
    [QueryParam]
    public int Page { get; set; } = 1;

    /// <summary>
    /// Itens por página (padrão: 20, máx: 100).
    /// </summary>
    [QueryParam]
    public int PageSize { get; set; } = 20;

    /// <summary>
    /// Filtrar por método de pagamento: pix, credit_card, boleto.
    /// </summary>
    [QueryParam]
    public PaymentMethod? Method { get; set; }

    /// <summary>
    /// Filtrar por status: pending, completed, expired, failed, refunded.
    /// </summary>
    [QueryParam]
    public PaymentStatus? Status { get; set; }

    /// <summary>
    /// Filtrar por ID externo.
    /// </summary>
    [QueryParam]
    public string? ExternalId { get; set; }

    /// <summary>
    /// Filtrar por ID do cliente.
    /// </summary>
    [QueryParam]
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// Data inicial (formato ISO 8601).
    /// </summary>
    [QueryParam]
    public DateTime? StartDate { get; set; }

    /// <summary>
    /// Data final (formato ISO 8601).
    /// </summary>
    [QueryParam]
    public DateTime? EndDate { get; set; }
}

/// <summary>
/// Validador do request de listagem.
/// </summary>
public sealed class ListTransactionsRequestValidator : Validator<ListTransactionsRequest>
{
    public ListTransactionsRequestValidator()
    {
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();

        RuleFor(x => x.Method)
            .Must(BeValidMethod)
            .When(x => x.Method.HasValue)
            .WithMessage("Método inválido. Use: pix, credit_card ou boleto.");

        RuleFor(x => x.Status)
            .Must(BeValidStatus)
            .When(x => x.Status.HasValue)
            .WithMessage("Status inválido. Use: pending, completed, expired, failed ou refunded.");

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual à data inicial.");
    }

    private static bool BeValidMethod(PaymentMethod? method)
    {
        return method.HasValue && Enum.IsDefined(method.Value);
    }

    private static bool BeValidStatus(PaymentStatus? status)
    {
        return status.HasValue && Enum.IsDefined(status.Value);
    }
}

/// <summary>
/// Response da listagem de transações.
/// </summary>
public sealed class ListTransactionsResponse : BaseResponse<PaginatedResponse<TransactionListItemData>>;

/// <summary>
/// Dados resumidos de uma transação na listagem.
/// </summary>
public sealed class TransactionListItemData
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
    /// Ambiente.
    /// </summary>
    public ApiEnvironment Environment { get; set; }

    /// <summary>
    /// Data de expiração.
    /// </summary>
    public DateTime? ExpiresAt { get; set; }

    /// <summary>
    /// Data de conclusão.
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    /// <summary>
    /// Data de criação.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// ID do cliente.
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// ID do pedido (se for transação via e-commerce/checkout).
    /// </summary>
    public Guid? OrderId { get; set; }

    /// <summary>
    /// ID do produto.
    /// </summary>
    public Guid? ProductId { get; set; }

    /// <summary>
    /// ID da variante.
    /// </summary>
    public Guid? VariantId { get; set; }

    /// <summary>
    /// Dados do cliente (se vinculado).
    /// </summary>
    public TransactionCustomerData? Customer { get; set; }

    /// <summary>
    /// Itens da transação (se houver).
    /// </summary>
    public List<TransactionItemData>? Items { get; set; }
}

/// <summary>
/// Item resumido da transação na listagem.
/// </summary>
public sealed class TransactionItemData
{
    public Guid ProductId { get; set; }
    public string? ProductName { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalAmount { get; set; }
}

/// <summary>
/// Dados resumidos do cliente na transação.
/// </summary>
public sealed class TransactionCustomerData
{
    /// <summary>
    /// ID do cliente.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome do cliente.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Email do cliente.
    /// </summary>
    public string? Email { get; set; }

    /// <summary>
    /// Documento do cliente.
    /// </summary>
    public string? Document { get; set; }

    /// <summary>
    /// Indica se os dados de contato foram substituidos por fallback tecnico.
    /// </summary>
    public bool HasFallbackContactData { get; set; }
}

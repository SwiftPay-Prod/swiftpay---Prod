using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.Endpoints.Models;
using safefy_api_payment.Validators;

using ApiEnvironment = safefy_api_core.Models.Enum.ApiEnvironment;

namespace safefy_api_payment.Endpoints.Orders.List;

/// <summary>
/// Request para listar pedidos.
/// </summary>
public sealed class ListOrdersRequest : IPaginatedRequest
{
    /// <summary>
    /// Status do pedido.
    /// </summary>
    public OrderStatus? Status { get; set; }

    /// <summary>
    /// Status de fulfillment.
    /// </summary>
    public OrderFulfillmentStatus? FulfillmentStatus { get; set; }

    /// <summary>
    /// ID do cliente.
    /// </summary>
    public Guid? CustomerId { get; set; }

    /// <summary>
    /// Número da página (padrão: 1).
    /// </summary>
    public int Page { get; set; } = 1;

    /// <summary>
    /// Itens por página (padrão: 10, máximo: 100).
    /// </summary>
    public int PageSize { get; set; } = 10;
}

public sealed class ListOrdersRequestValidator : Validator<ListOrdersRequest>
{
    public ListOrdersRequestValidator()
    {
        this.AddPaginationRules();

        RuleFor(x => x.PageSize)
            .LessThanOrEqualTo(100).WithMessage("O limite máximo é 100 itens por página.");
    }
}

/// <summary>
/// Response da listagem de pedidos.
/// </summary>
public sealed class ListOrdersResponse : BaseResponse<PaginatedResponse<ListOrderItemData>>;

/// <summary>
/// Item da listagem de pedidos.
/// </summary>
public sealed class ListOrderItemData
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public long TotalAmount { get; set; }
    public ApiEnvironment Environment { get; set; }
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Cliente do pedido.
    /// </summary>
    public ListOrderCustomerData? Customer { get; set; }

    /// <summary>
    /// Status do pagamento.
    /// </summary>
    public PaymentStatus? PaymentStatus { get; set; }

    /// <summary>
    /// Quantidade de itens no pedido.
    /// </summary>
    public int ItemCount { get; set; }
}

/// <summary>
/// Dados do cliente na listagem.
/// </summary>
public sealed class ListOrderCustomerData
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
}

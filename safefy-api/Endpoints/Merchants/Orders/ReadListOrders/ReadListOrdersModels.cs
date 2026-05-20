using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api.Validators;

namespace safefy_api.Endpoints.Merchants.Orders.ReadListOrders;

public sealed class ReadListOrdersRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public OrderStatus? Status { get; set; }
    public OrderFulfillmentStatus? FulfillmentStatus { get; set; }
    public string? Search { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public sealed class ReadListOrdersValidator : Validator<ReadListOrdersRequest>
{
    public ReadListOrdersValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty()
            .WithMessage("O identificador da organização é obrigatório.");

        this.AddPaginationRules();

        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("A data final deve ser maior ou igual à data inicial.");

        RuleFor(x => x.Search)
            .MaximumLength(100)
            .When(x => !string.IsNullOrWhiteSpace(x.Search))
            .WithMessage("A busca deve ter no máximo 100 caracteres.");
    }
}

public sealed class ReadListOrdersResponse : BaseResponse<Paginated<MinimalOrder>>;

public sealed class MinimalOrder
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = null!;
    public OrderStatus Status { get; set; }
    public OrderFulfillmentStatus FulfillmentStatus { get; set; }
    public long SubtotalAmount { get; set; }
    public long DiscountAmount { get; set; }
    public long ShippingAmount { get; set; }
    public long TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public MinimalOrderCustomer? Customer { get; set; }
    public MinimalOrderPayment? Payment { get; set; }
}

public sealed class MinimalOrderCustomer
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Email { get; set; }
}

public sealed class MinimalOrderPayment
{
    public Guid Id { get; set; }
    public PaymentStatus Status { get; set; }
    public PaymentMethod Method { get; set; }
    public DateTime? CompletedAt { get; set; }
}

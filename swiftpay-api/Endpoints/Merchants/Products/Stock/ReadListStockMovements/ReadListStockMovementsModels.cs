using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Products.Stock.ReadListStockMovements;

public sealed class ReadListStockMovementsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public StockMovementType? Type { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public sealed class ReadListStockMovementsValidator : Validator<ReadListStockMovementsRequest>
{
    public ReadListStockMovementsValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("O identificador do produto é obrigatório.");

        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
    }
}

public sealed class ReadListStockMovementsResponse : BaseResponse<Paginated<StockMovementData>>;

public sealed class StockMovementData
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string? VariantName { get; set; }
    public StockMovementType Type { get; set; }
    public StockMovementReferenceType ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public int Quantity { get; set; }
    public int BalanceBefore { get; set; }
    public int BalanceAfter { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

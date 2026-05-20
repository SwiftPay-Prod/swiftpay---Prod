using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Products.Stock.AdjustProductStock;

public sealed class AdjustProductStockRequest
{
    public Guid MerchantId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public StockMovementType Type { get; set; }
    public int Quantity { get; set; }
    public string? Notes { get; set; }
}

public sealed class AdjustProductStockValidator : Validator<AdjustProductStockRequest>
{
    public AdjustProductStockValidator()
    {
        RuleFor(x => x.MerchantId)
            .NotEmpty().WithMessage("O identificador da organização é obrigatório.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("O identificador do produto é obrigatório.");

        RuleFor(x => x.Type)
            .Must(t => t == StockMovementType.In || t == StockMovementType.Out || t == StockMovementType.Adjustment)
            .WithMessage("Tipo de movimentação inválido. Use In, Out ou Adjustment.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("A quantidade deve ser maior que zero.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).WithMessage("As observações devem ter no máximo 500 caracteres.");
    }
}

public sealed class AdjustProductStockResponse : BaseResponse<StockAdjustmentData>;

public sealed class StockAdjustmentData
{
    public Guid MovementId { get; set; }
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public StockMovementType Type { get; set; }
    public int Quantity { get; set; }
    public int BalanceBefore { get; set; }
    public int BalanceAfter { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

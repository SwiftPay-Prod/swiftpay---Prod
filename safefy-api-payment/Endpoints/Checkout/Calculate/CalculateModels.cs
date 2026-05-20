using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Calculate;

public sealed class CalculateRequest
{
    public string ShortId { get; set; } = string.Empty;
    public List<CalculateItemInput> Items { get; set; } = [];
    public string? CouponCode { get; set; }
    public string? Zipcode { get; set; }
}

public sealed class CalculateItemInput
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public int Quantity { get; set; }
}

public sealed class CalculateRequestValidator : Validator<CalculateRequest>
{
    public CalculateRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("É necessário informar pelo menos um item.");

        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId)
                .NotEmpty().WithMessage("O identificador do produto é obrigatório.");

            item.RuleFor(i => i.Quantity)
                .GreaterThan(0).WithMessage("A quantidade deve ser maior que zero.");
        });

        RuleFor(x => x.Zipcode)
            .Length(8).When(x => !string.IsNullOrWhiteSpace(x.Zipcode))
            .WithMessage("O CEP deve ter 8 dígitos.");
    }
}

public sealed class CalculateResponse : BaseResponse<CalculateData>;

public sealed class CalculateData
{
    public long Subtotal { get; set; }
    public long Discount { get; set; }
    public long Shipping { get; set; }
    public long Total { get; set; }
    public CalculateCouponInfo? Coupon { get; set; }
    public List<CalculateItemInfo> Items { get; set; } = [];
}

public sealed class CalculateCouponInfo
{
    public string Code { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public long DiscountAmount { get; set; }
}

public sealed class CalculateItemInfo
{
    public Guid ProductId { get; set; }
    public Guid? VariantId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? VariantName { get; set; }
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public long UnitPrice { get; set; }
    public long TotalPrice { get; set; }
    public int? StockQuantity { get; set; }
    public bool IsInStock { get; set; } = true;
}

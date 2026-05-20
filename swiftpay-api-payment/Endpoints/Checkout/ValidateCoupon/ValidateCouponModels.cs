using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using safefy_api_core.Models.Database;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.ValidateCoupon;

public sealed class ValidateCouponRequest
{
    public string ShortId { get; set; } = string.Empty;
    public string CouponCode { get; set; } = string.Empty;
}

public sealed class ValidateCouponRequestValidator : Validator<ValidateCouponRequest>
{
    public ValidateCouponRequestValidator()
    {
        RuleFor(x => x.ShortId)
            .NotEmpty().WithMessage("O identificador do checkout é obrigatório.");

        RuleFor(x => x.CouponCode)
            .NotEmpty().WithMessage("O código do cupom é obrigatório.")
            .MaximumLength(50).WithMessage("O código do cupom deve ter no máximo 50 caracteres.");
    }
}

public sealed class ValidateCouponResponse : BaseResponse<ValidateCouponData>;

public sealed class ValidateCouponData
{
    public string Code { get; set; } = string.Empty;
    public string? Name { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public long? MinOrderAmount { get; set; }
    public long? MaxDiscountAmount { get; set; }
    public CouponScope Scope { get; set; }
    public List<Guid>? ApplicableProductIds { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CouponScope
{
    Global,
    Checkout,
    Product
}

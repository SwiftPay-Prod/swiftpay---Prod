using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Coupons.CreateCoupon;

public sealed class CreateCouponRequest
{
    public Guid MerchantId { get; set; }
    public string Code { get; set; } = null!;
    public string? Name { get; set; }
    public string? Description { get; set; }
    public CouponDiscountType DiscountType { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? MaxDiscountAmount { get; set; }
    public long? MinOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    public int? MaxUsesPerCustomer { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool ApplyToAllProducts { get; set; } = true;
    public bool ApplyToAllCheckouts { get; set; } = true;
    public ICollection<Guid>? ProductIds { get; set; }
    public ICollection<Guid>? CheckoutIds { get; set; }
}

public sealed class CreateCouponRequestValidator : Validator<CreateCouponRequest>
{
    public CreateCouponRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("O código do cupom é obrigatório.")
            .MaximumLength(50).WithMessage("O código deve ter no máximo 50 caracteres.")
            .Matches(@"^[A-Za-z0-9_-]+$").WithMessage("O código deve conter apenas letras, números, traços e underlines.");
        
        RuleFor(x => x.Name)
            .MaximumLength(100).WithMessage("O nome deve ter no máximo 100 caracteres.");
        
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("A descrição deve ter no máximo 500 caracteres.");
        
        RuleFor(x => x.DiscountType)
            .IsInEnum().WithMessage("O tipo de desconto é inválido.");
        
        RuleFor(x => x.DiscountFixedAmount)
            .GreaterThan(0).When(x => x.DiscountType == CouponDiscountType.FixedAmount)
            .WithMessage("O valor fixo de desconto deve ser maior que zero.");
        
        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(1, 10000).When(x => x.DiscountType == CouponDiscountType.Percentage)
            .WithMessage("O percentual de desconto deve estar entre 0.01% e 100%.");
        
        RuleFor(x => x.MaxDiscountAmount)
            .GreaterThan(0).When(x => x.MaxDiscountAmount.HasValue)
            .WithMessage("O valor máximo de desconto deve ser maior que zero.");
        
        RuleFor(x => x.MinOrderAmount)
            .GreaterThanOrEqualTo(0).When(x => x.MinOrderAmount.HasValue)
            .WithMessage("O valor mínimo do pedido deve ser maior ou igual a zero.");
        
        RuleFor(x => x.MaxUses)
            .GreaterThan(0).When(x => x.MaxUses.HasValue)
            .WithMessage("O máximo de usos deve ser maior que zero.");
        
        RuleFor(x => x.MaxUsesPerCustomer)
            .GreaterThan(0).When(x => x.MaxUsesPerCustomer.HasValue)
            .WithMessage("O máximo de usos por cliente deve ser maior que zero.");
        
        RuleFor(x => x.ValidUntil)
            .GreaterThan(x => x.ValidFrom).When(x => x.ValidFrom.HasValue && x.ValidUntil.HasValue)
            .WithMessage("A data de término deve ser posterior à data de início.");
    }
}

public sealed class CreateCouponResponse : BaseResponse<CouponData>;

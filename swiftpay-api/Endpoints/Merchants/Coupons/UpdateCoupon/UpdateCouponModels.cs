using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;
using safefy_api_core.Models.Database;

namespace safefy_api.Endpoints.Merchants.Coupons.UpdateCoupon;

public sealed class UpdateCouponRequest
{
    public Guid MerchantId { get; set; }
    public Guid CouponId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public CouponDiscountType? DiscountType { get; set; }
    public long? DiscountFixedAmount { get; set; }
    public int? DiscountPercentage { get; set; }
    public long? MaxDiscountAmount { get; set; }
    public long? MinOrderAmount { get; set; }
    public int? MaxUses { get; set; }
    public int? MaxUsesPerCustomer { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidUntil { get; set; }
    public CouponStatus? Status { get; set; }
    public bool? ApplyToAllProducts { get; set; }
    public bool? ApplyToAllCheckouts { get; set; }
    public ICollection<Guid>? ProductIds { get; set; }
    public ICollection<Guid>? CheckoutIds { get; set; }

    // Clear flags (when true, set field to null)
    public bool ClearMinOrderAmount { get; set; }
    public bool ClearMaxDiscountAmount { get; set; }
    public bool ClearMaxUses { get; set; }
    public bool ClearMaxUsesPerCustomer { get; set; }
    public bool ClearValidFrom { get; set; }
    public bool ClearValidUntil { get; set; }
}

public sealed class UpdateCouponRequestValidator : Validator<UpdateCouponRequest>
{
    public UpdateCouponRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CouponId).NotEmpty().WithMessage("O identificador do cupom é obrigatório.");
        
        RuleFor(x => x.Name)
            .MaximumLength(100).When(x => x.Name != null)
            .WithMessage("O nome deve ter no máximo 100 caracteres.");
        
        RuleFor(x => x.Description)
            .MaximumLength(500).When(x => x.Description != null)
            .WithMessage("A descrição deve ter no máximo 500 caracteres.");
        
        RuleFor(x => x.DiscountType)
            .IsInEnum().When(x => x.DiscountType.HasValue)
            .WithMessage("O tipo de desconto é inválido.");
        
        RuleFor(x => x.DiscountFixedAmount)
            .GreaterThan(0).When(x => x.DiscountFixedAmount.HasValue)
            .WithMessage("O valor fixo de desconto deve ser maior que zero.");
        
        RuleFor(x => x.DiscountPercentage)
            .InclusiveBetween(1, 10000).When(x => x.DiscountPercentage.HasValue)
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
        
        RuleFor(x => x.Status)
            .IsInEnum().When(x => x.Status.HasValue)
            .WithMessage("O status é inválido.");
    }
}

public sealed class UpdateCouponResponse : BaseResponse<CouponData>;

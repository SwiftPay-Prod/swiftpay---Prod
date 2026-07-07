using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;
using swiftpay_api.Validators;
using swiftpay_api_core.Models.Database;

namespace swiftpay_api.Endpoints.Merchants.Coupons.ReadListCoupons;

public sealed class ReadListCouponsRequest : IPaginatedRequest
{
    public Guid MerchantId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public CouponStatus? Status { get; set; }
    public CouponDiscountType? DiscountType { get; set; }
    public bool? ApplyToAllProducts { get; set; }
}

public sealed class ReadListCouponsRequestValidator : Validator<ReadListCouponsRequest>
{
    public ReadListCouponsRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.Page).ValidPage();
        RuleFor(x => x.PageSize).ValidPageSize();
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("O status é inválido.");
        RuleFor(x => x.DiscountType).IsInEnum().When(x => x.DiscountType.HasValue).WithMessage("O tipo de desconto é inválido.");
    }
}

public sealed class ReadListCouponsResponse : BaseResponse<Paginated<MinimalCoupon>>;

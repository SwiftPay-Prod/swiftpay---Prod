using FastEndpoints;
using FluentValidation;
using safefy_api.Endpoints.Models;

namespace safefy_api.Endpoints.Merchants.Coupons.ReadCoupon;

public sealed class ReadCouponRequest
{
    public Guid MerchantId { get; set; }
    public Guid CouponId { get; set; }
}

public sealed class ReadCouponRequestValidator : Validator<ReadCouponRequest>
{
    public ReadCouponRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CouponId).NotEmpty().WithMessage("O identificador do cupom é obrigatório.");
    }
}

public sealed class ReadCouponResponse : BaseResponse<CouponData>;

using FastEndpoints;
using FluentValidation;
using swiftpay_api.Endpoints.Models;

namespace swiftpay_api.Endpoints.Merchants.Coupons.DeleteCoupon;

public sealed class DeleteCouponRequest
{
    public Guid MerchantId { get; set; }
    public Guid CouponId { get; set; }
}

public sealed class DeleteCouponRequestValidator : Validator<DeleteCouponRequest>
{
    public DeleteCouponRequestValidator()
    {
        RuleFor(x => x.MerchantId).NotEmpty().WithMessage("O identificador da organização é obrigatório.");
        RuleFor(x => x.CouponId).NotEmpty().WithMessage("O identificador do cupom é obrigatório.");
    }
}

public sealed class DeleteCouponResponse : BaseResponse;

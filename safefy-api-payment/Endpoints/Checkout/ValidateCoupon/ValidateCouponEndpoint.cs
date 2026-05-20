using FastEndpoints;
using safefy_api_core.Database;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.ValidateCoupon;

public sealed class ValidateCouponEndpoint(PrimaryDbContext dbContext) : Endpoint<ValidateCouponRequest, ValidateCouponResponse>
{
    public override void Configure()
    {
        Post("{shortId}/validate-coupon");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(ValidateCouponRequest req, CancellationToken ct)
    {
        var handler = new ValidateCouponHandler(dbContext);
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

using FastEndpoints;
using safefy_api_core.Database;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Get;

public sealed class GetCheckoutEndpoint(PrimaryDbContext dbContext) : Endpoint<GetCheckoutRequest, GetCheckoutResponse>
{
    public override void Configure()
    {
        Get("{shortId}");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(GetCheckoutRequest req, CancellationToken ct)
    {
        var handler = new GetCheckoutHandler(dbContext);
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

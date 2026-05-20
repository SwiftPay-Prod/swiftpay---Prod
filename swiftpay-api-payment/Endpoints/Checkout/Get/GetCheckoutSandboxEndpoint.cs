using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Get;

public sealed class GetCheckoutSandboxEndpoint(PrimaryDbContext dbContext) : Endpoint<GetCheckoutRequest, GetCheckoutResponse>
{
    public override void Configure()
    {
        Get("{shortId}");
        Group<CheckoutSandboxGroup>();
    }

    public override async Task HandleAsync(GetCheckoutRequest req, CancellationToken ct)
    {
        var handler = new GetCheckoutHandler(dbContext);
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

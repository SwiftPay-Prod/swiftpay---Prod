using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_payment.EndpointsGroups;
using swiftpay_api_payment.Endpoints.Models;

namespace swiftpay_api_payment.Endpoints.Checkout.Get;

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

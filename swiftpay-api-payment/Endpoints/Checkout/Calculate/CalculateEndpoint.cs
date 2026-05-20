using FastEndpoints;
using safefy_api_core.Database;
using safefy_api_payment.EndpointsGroups;
using safefy_api_payment.Endpoints.Models;

namespace safefy_api_payment.Endpoints.Checkout.Calculate;

public sealed class CalculateEndpoint(PrimaryDbContext dbContext) : Endpoint<CalculateRequest, CalculateResponse>
{
    public override void Configure()
    {
        Post("{shortId}/calculate");
        Group<CheckoutGroup>();
    }

    public override async Task HandleAsync(CalculateRequest req, CancellationToken ct)
    {
        var handler = new CalculateHandler(dbContext);
        var (response, statusCode) = await handler.HandleAsync(req, ct);
        await Send.ResponseAsync(response, statusCode, ct);
    }
}

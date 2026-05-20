using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.ReadPlatformPayout;

public sealed class ReadPlatformPayoutEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadPlatformPayoutRequest, ReadPlatformPayoutResponse>
{
    public override void Configure()
    {
        Get("platform-payouts/{id:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadPlatformPayoutRequest req, CancellationToken ct)
    {
        var payout = await dbContext.PlatformPayouts
            .AsNoTracking()
            .Include(p => p.PayoutAccount)
            .Include(p => p.RequestedByUser)
            .Include(p => p.Items)
                .ThenInclude(i => i.Acquirer)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => p.Id == req.Id, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new ReadPlatformPayoutResponse
            {
                Error = new("Saque não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadPlatformPayoutResponse
        {
            Data = PlatformPayoutMapper.ToData(payout)
        }, ct);
    }
}

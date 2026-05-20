using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;

namespace safefy_api.Endpoints.Admin.PlatformPayouts.ReadListPlatformPayouts;

public sealed class ReadListPlatformPayoutsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListPlatformPayoutsRequest, ReadListPlatformPayoutsResponse>
{
    public override void Configure()
    {
        Get("platform-payouts");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListPlatformPayoutsRequest req, CancellationToken ct)
    {
        var query = dbContext.PlatformPayouts
            .AsNoTracking()
            .Include(p => p.PayoutAccount)
            .Include(p => p.RequestedByUser)
            .Include(p => p.Items)
                .ThenInclude(i => i.Acquirer)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(p => p.Status == req.Status.Value);
        }

        query = query.OrderByDescending(p => p.RequestedAt);

        var totalItems = await query.CountAsync(ct);

        var payouts = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListPlatformPayoutsResponse
        {
            Data = new Paginated<CreatePlatformPayout.AdminPlatformPayoutData>
            {
                Items = payouts.Select(p => PlatformPayoutMapper.ToData(p)).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}

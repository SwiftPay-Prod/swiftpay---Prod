using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;

namespace safefy_api.Endpoints.Admin.PlatformPayoutAccounts.ReadListPlatformPayoutAccounts;

public sealed class ReadListPlatformPayoutAccountsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadListPlatformPayoutAccountsRequest, ReadListPlatformPayoutAccountsResponse>
{
    public override void Configure()
    {
        Get("platform-payout-accounts");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListPlatformPayoutAccountsRequest req, CancellationToken ct)
    {
        var query = dbContext.PlatformPayoutAccounts
            .Include(a => a.CreatedByUser)
            .OrderByDescending(a => a.IsActive)
            .ThenByDescending(a => a.CreatedAt);

        var totalItems = await query.CountAsync(ct);

        var accounts = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadListPlatformPayoutAccountsResponse
        {
            Data = new()
            {
                Items = accounts.Select(a => PlatformPayoutAccountMapper.ToData(a)).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}

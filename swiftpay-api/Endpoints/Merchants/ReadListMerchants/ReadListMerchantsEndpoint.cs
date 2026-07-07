using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Endpoints.Models;
using swiftpay_api_core.Utils;
using swiftpay_api_core.Models.Database;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Interfaces;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.ReadListMerchants;

public sealed class ReadListMerchantsEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<ReadListMerchantsRequest, ReadListMerchantsResponse>
{
    public override void Configure()
    {
        Get("");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadListMerchantsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadListMerchantsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var query = dbContext.Merchants
            .Where(m => m.UserId == userId)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(m => m.Status == req.Status.Value);
        }
        else
        {
            query = query.Where(m => m.Status != MerchantStatus.Deleted);
        }

        query = query.OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);

        var merchants = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Include(m => m.MerchantKyc)
            .Include(m => m.MerchantSettings)
            .AsSplitQuery()
            .ToListAsync(ct);

        var platformSettings = await dbContext.PlatformSettings.OrderBy(p => p.Id).FirstOrDefaultAsync(ct);

        var merchantIds = merchants.Select(m => m.Id).ToList();
        var balances = await ledgerService.GetMerchantsAvailableBalancesAsync(merchantIds);

        var items = merchants.Select(m =>
        {
            balances.TryGetValue(m.Id, out var balance);
            return MinimalMerchantMapper.ToData(m, balance, platformSettings);
        }).ToList();

        await Send.ResponseAsync(new ReadListMerchantsResponse
        {
            Data = new Paginated<MinimalMerchant>
            {
                Items = items,
                TotalItems = totalCount,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = totalPages
            }
        }, cancellation: ct);
    }
}

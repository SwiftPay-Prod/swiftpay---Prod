using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api.Endpoints.Models;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;
using safefy_api_core.Database;
using safefy_api_core.Models.Database;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Balance.ReadAcquirerMerchantAvailability;

public sealed class ReadAcquirerMerchantAvailabilityEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadAcquirerMerchantAvailabilityRequest, ReadAcquirerMerchantAvailabilityResponse>
{
    public override void Configure()
    {
        Get("balance/acquirers/{acquirerId:guid}/merchant-availability");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadAcquirerMerchantAvailabilityRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadAcquirerMerchantAvailabilityResponse
            {
                Error = new("Token invalido.")
            }, 401, ct);
            return;
        }

        var acquirerExists = await dbContext.Acquirers
            .AsNoTracking()
            .AnyAsync(a => a.Id == req.AcquirerId, ct);

        if (!acquirerExists)
        {
            await Send.ResponseAsync(new ReadAcquirerMerchantAvailabilityResponse
            {
                Error = new("Adquirente nao encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Accounts
            .AsNoTracking()
            .Where(a => (a.Type == AccountType.MerchantAvailable || a.Type == AccountType.MerchantBlocked || a.Type == AccountType.MerchantReserved)
                     && a.MerchantId.HasValue
                     && a.MerchantAcquirerId.HasValue
                     && a.Balance != 0
                     && a.MerchantAcquirer != null
                     && a.MerchantAcquirer.AcquirerId == req.AcquirerId);

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var search = req.Search.Trim().ToLower();
            query = query.Where(a =>
                (a.Merchant != null && a.Merchant.Name != null && a.Merchant.Name.ToLower().Contains(search))
                || (a.Merchant != null && a.Merchant.MerchantKyc != null && a.Merchant.MerchantKyc.LegalName != null && a.Merchant.MerchantKyc.LegalName.ToLower().Contains(search))
                || (a.Merchant != null && a.Merchant.MerchantKyc != null && a.Merchant.MerchantKyc.DocumentNumber != null && a.Merchant.MerchantKyc.DocumentNumber.ToLower().Contains(search))
                || (a.Merchant != null && a.Merchant.Email != null && a.Merchant.Email.ToLower().Contains(search))
                || (a.Merchant != null && a.Merchant.User.Email.ToLower().Contains(search)));
        }

        var groupedQuery = query
            .GroupBy(a => a.MerchantId!.Value)
            .Select(g => new AdminPlatformBalanceMerchantAvailabilityProjection
            {
                MerchantId = g.Key,
                MerchantName = g.Max(x => x.Merchant != null ? x.Merchant.Name : null),
                Email = g.Max(x => x.Merchant != null ? (x.Merchant.Email ?? x.Merchant.User.Email) : null),
                DocumentNumber = g.Max(x => x.Merchant != null && x.Merchant.MerchantKyc != null ? x.Merchant.MerchantKyc.DocumentNumber : null),
                DocumentType = g.Max(x => x.Merchant != null && x.Merchant.MerchantKyc != null ? x.Merchant.MerchantKyc.DocumentType : null),
                AvailableBalance = g.Sum(x => x.Type == AccountType.MerchantAvailable ? x.Balance : 0),
                BlockedBalance = g.Sum(x => x.Type == AccountType.MerchantBlocked ? x.Balance : 0),
                ReservedBalance = g.Sum(x => x.Type == AccountType.MerchantReserved ? x.Balance : 0)
            });

        groupedQuery = groupedQuery
            .Where(x => x.AvailableBalance != 0 || x.BlockedBalance != 0 || x.ReservedBalance != 0);

        var totalItems = await groupedQuery.CountAsync(ct);

        var items = await groupedQuery
            .OrderByDescending(x => x.AvailableBalance + x.BlockedBalance + x.ReservedBalance)
            .ThenByDescending(x => x.AvailableBalance)
            .ThenByDescending(x => x.BlockedBalance)
            .ThenByDescending(x => x.ReservedBalance)
            .ThenBy(x => x.MerchantName)
            .ThenBy(x => x.MerchantId)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        await Send.OkAsync(new ReadAcquirerMerchantAvailabilityResponse
        {
            Data = new Paginated<AdminPlatformBalanceMerchantAvailabilityData>
            {
                Items = items.Select(AdminPlatformBalanceMerchantAvailabilityMapper.ToData).ToList(),
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}
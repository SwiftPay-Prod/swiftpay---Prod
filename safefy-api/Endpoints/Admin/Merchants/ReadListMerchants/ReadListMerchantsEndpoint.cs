using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Models;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api_core.Models.Enum;
using safefy_api_core.Interfaces;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Admin.Merchants.ReadListMerchants;

public sealed class ReadListMerchantsEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<ReadListMerchantsRequest, ReadListMerchantsResponse>
{
    public override void Configure()
    {
        Get("merchants");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadListMerchantsRequest req, CancellationToken ct)
    {
        var adminId = EndpointUtils.GetUserId(User);
        if (adminId == null)
        {
            await Send.ResponseAsync(new ReadListMerchantsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var query = dbContext.Merchants
            .Include(m => m.User)
            .Include(m => m.MerchantSettings)
                .Include(m => m.MerchantAcquirers.Where(ma => ma.IsActive))
                .ThenInclude(ma => ma.Acquirer)
            .Include(m => m.MerchantKyc)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(m => m.Status == req.Status.Value);
        }
        else
        {
            query = query.Where(m => m.Status != MerchantStatus.Deleted);
        }

        if (req.KycStatus.HasValue)
        {
            query = query.Where(m => m.KycStatus == req.KycStatus.Value);
        }

        if (req.UserId.HasValue)
        {
            query = query.Where(m => m.UserId == req.UserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchLower = req.Search.ToLower();
            var searchSanitized = SanitizeUtils.SanitizeNumeric(req.Search);
            var hasNumericSearch = !string.IsNullOrEmpty(searchSanitized);

            if (hasNumericSearch)
            {
                query = query.Where(m =>
                    (m.Name != null && m.Name.ToLower().Contains(searchLower)) ||
                    (m.Email != null && m.Email.ToLower().Contains(searchLower)) ||
                    (m.PhoneNumber != null && m.PhoneNumber.Contains(searchSanitized!)) ||
                    (m.MerchantKyc != null && m.MerchantKyc.DocumentNumber != null && m.MerchantKyc.DocumentNumber.Contains(searchSanitized!)) ||
                    (m.User.Name != null && m.User.Name.ToLower().Contains(searchLower)) ||
                    (m.User.Email != null && m.User.Email.ToLower().Contains(searchLower))
                );
            }
            else
            {
                query = query.Where(m =>
                    (m.Name != null && m.Name.ToLower().Contains(searchLower)) ||
                    (m.Email != null && m.Email.ToLower().Contains(searchLower)) ||
                    (m.User.Name != null && m.User.Name.ToLower().Contains(searchLower)) ||
                    (m.User.Email != null && m.User.Email.ToLower().Contains(searchLower))
                );
            }
        }

        query = query.OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync(ct);
        var totalPages = (int)Math.Ceiling(totalCount / (double)req.PageSize);

        var merchantIds = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(m => m.Id)
            .ToListAsync(ct);

        var merchantBalances = await dbContext.MerchantBalances
            .Where(mb => merchantIds.Contains(mb.MerchantId))
            .ToDictionaryAsync(mb => mb.MerchantId, mb => new { mb.LifetimeVolume, mb.LifetimeFeesPaid }, ct);

        var balances = await ledgerService.GetMerchantsAvailableBalancesAsync(merchantIds);

        var merchants = await query
            .Where(m => merchantIds.Contains(m.Id))
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync(ct);

        var activeAbTestMerchantIds = await dbContext.MerchantNominalAbTests
            .AsNoTracking()
            .Where(t => t.IsActive && merchantIds.Contains(t.MerchantId))
            .Select(t => t.MerchantId)
            .Distinct()
            .ToListAsync(ct);

        var activeAbTestMerchantIdsSet = activeAbTestMerchantIds.ToHashSet();

        var items = merchants.Select(m =>
        {
            merchantBalances.TryGetValue(m.Id, out var balance);
            balances.TryGetValue(m.Id, out var availableBalance);
            return AdminMinimalMerchantMapper.ToMinimalData(
                m, 
                balance?.LifetimeVolume ?? 0, 
                balance?.LifetimeFeesPaid ?? 0,
                availableBalance,
                activeAbTestMerchantIdsSet.Contains(m.Id));
        }).ToList();

        await Send.ResponseAsync(new ReadListMerchantsResponse
        {
            Data = new Paginated<AdminMinimalMerchant>
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

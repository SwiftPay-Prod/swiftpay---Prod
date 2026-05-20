using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Endpoints.Models;
using safefy_api.Mappers;
using safefy_api_core.Utils;

namespace safefy_api.Endpoints.Admin.Cashouts.ListCashouts;

public sealed class ListCashoutsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListCashoutsRequest, ListCashoutsResponse>
{
    public override void Configure()
    {
        Get("cashouts");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ListCashoutsRequest req, CancellationToken ct)
    {
        var query = dbContext.Payouts
            .Include(p => p.Merchant)
                .ThenInclude(m => m.MerchantKyc)
            .Include(p => p.PayoutAccount)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma!.Acquirer)
            .AsQueryable();

        if (req.Status.HasValue)
        {
            query = query.Where(p => p.Status == req.Status.Value);
        }

        if (req.MerchantId.HasValue)
        {
            query = query.Where(p => p.MerchantId == req.MerchantId.Value);
        }

        if (req.AcquirerId.HasValue)
        {
            query = query.Where(p => p.MerchantAcquirer != null && p.MerchantAcquirer.AcquirerId == req.AcquirerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(req.Search))
        {
            var searchValue = req.Search.Trim();
            var searchLower = searchValue.ToLower();
            var searchSanitized = SanitizeUtils.SanitizeNumeric(searchValue) ?? "";
            var hasGuid = Guid.TryParse(searchValue, out var searchGuid);
            var hasNumeric = !string.IsNullOrEmpty(searchSanitized);
            query = query.Where(p =>
                (hasGuid && p.Id == searchGuid) ||
                (p.AcquirerDisplayName != null && p.AcquirerDisplayName.ToLower().Contains(searchLower)) ||
                (p.MerchantAcquirer != null && p.MerchantAcquirer.Acquirer != null && p.MerchantAcquirer.Acquirer.DisplayName != null && p.MerchantAcquirer.Acquirer.DisplayName.ToLower().Contains(searchLower)) ||
                (p.MerchantAcquirer != null && p.MerchantAcquirer.Acquirer != null && p.MerchantAcquirer.Acquirer.Name.ToLower().Contains(searchLower)) ||
                (p.Merchant.Name != null && p.Merchant.Name.ToLower().Contains(searchLower)) ||
                (hasNumeric && p.Merchant.MerchantKyc != null && p.Merchant.MerchantKyc.DocumentNumber != null && p.Merchant.MerchantKyc.DocumentNumber.Contains(searchSanitized)) ||
                (p.PayoutAccount != null && p.PayoutAccount.PixKey != null && p.PayoutAccount.PixKey.ToLower().Contains(searchLower)) ||
                (p.PayoutAccount != null && p.PayoutAccount.HolderName != null && p.PayoutAccount.HolderName.ToLower().Contains(searchLower)) ||
                (hasNumeric && p.PayoutAccount != null && p.PayoutAccount.HolderDocument != null && p.PayoutAccount.HolderDocument.Contains(searchSanitized)) ||
                (p.InlinePixKey != null && p.InlinePixKey.ToLower().Contains(searchLower)) ||
                (p.PixEndToEndId != null && p.PixEndToEndId.ToLower().Contains(searchLower))
            );
        }

        query = query.OrderByDescending(p => p.RequestedAt);

        var totalItems = await query.CountAsync(ct);

        var payouts = await query
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = payouts.Select(CashoutMapper.ToMinimalData).ToList();

        await Send.OkAsync(new ListCashoutsResponse
        {
            Data = new Paginated<AdminMinimalCashout>
            {
                Items = items,
                TotalItems = totalItems,
                Page = req.Page,
                PageSize = req.PageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)req.PageSize)
            }
        }, ct);
    }
}

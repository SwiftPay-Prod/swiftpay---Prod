using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api.Endpoints.Models;
using safefy_api.Mappers;
using safefy_api_core.Models.Enum;

namespace safefy_api.Endpoints.Merchants.Cashouts.ListCashouts;

public sealed class ListCashoutsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListCashoutsRequest, ListCashoutsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/cashouts");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ListCashoutsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ListCashoutsResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var isAdmin = EndpointUtils.IsAdmin(User);
        var merchant = isAdmin
            ? await dbContext.Merchants.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId, ct)
            : await dbContext.Merchants.OrderBy(m => m.Id).FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ListCashoutsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.Payouts
            .AsNoTracking()
            .Include(p => p.PayoutAccount)
            .Where(p => p.MerchantId == req.MerchantId);

        if (req.Status.HasValue)
        {
            query = query.Where(p => p.Status == req.Status.Value);
        }

        if (req.PayoutAccountId.HasValue)
        {
            query = query.Where(p => p.MerchantPayoutAccountId == req.PayoutAccountId.Value);
        }

        if (req.StartDate.HasValue)
        {
            query = query.Where(p => p.RequestedAt >= req.StartDate.Value);
        }

        if (req.EndDate.HasValue)
        {
            query = query.Where(p => p.RequestedAt <= req.EndDate.Value.AddDays(1).AddTicks(-1));
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
                (p.PayoutAccount != null && p.PayoutAccount.PixKey != null && p.PayoutAccount.PixKey.ToLower().Contains(searchLower)) ||
                (p.PayoutAccount != null && p.PayoutAccount.HolderName != null && p.PayoutAccount.HolderName.ToLower().Contains(searchLower)) ||
                (hasNumeric && p.PayoutAccount != null && p.PayoutAccount.HolderDocument != null && p.PayoutAccount.HolderDocument.Contains(searchSanitized)) ||
                (p.InlinePixKey != null && p.InlinePixKey.ToLower().Contains(searchLower)) ||
                (p.PixEndToEndId != null && p.PixEndToEndId.ToLower().Contains(searchLower))
            );
        }

        var totalItems = await query.CountAsync(ct);

        var payouts = await query
            .OrderByDescending(p => p.RequestedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        var items = payouts.Select(CashoutMapper.ToListItem).ToList();

        await Send.OkAsync(new ListCashoutsResponse
        {
            Data = new Paginated<CashoutListItem>
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

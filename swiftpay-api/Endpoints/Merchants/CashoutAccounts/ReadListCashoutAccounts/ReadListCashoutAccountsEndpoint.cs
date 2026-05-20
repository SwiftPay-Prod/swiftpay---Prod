using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api_core.Utils;
using safefy_api_core.Models.Database;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Merchants.CashoutAccounts.ReadListCashoutAccounts;

public sealed class ReadListCashoutAccountsEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ListCashoutAccountsRequest, ListCashoutAccountsResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/cashout-accounts");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ListCashoutAccountsRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ListCashoutAccountsResponse
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
            await Send.ResponseAsync(new ListCashoutAccountsResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var query = dbContext.MerchantPayoutAccounts
            .Where(a => a.MerchantId == req.MerchantId);

        if (req.Statuses != null && req.Statuses.Count > 0)
        {
            query = query.Where(a => req.Statuses.Contains(a.Status));
        }
        else
        {
            query = query.Where(a => a.Status != PayoutAccountStatus.Inactive);
        }

        var accounts = await query
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        var items = accounts.Select(CashoutAccountMapper.ToListItem).ToList();

        await Send.OkAsync(new ListCashoutAccountsResponse
        {
            Data = new ListCashoutAccountsData
            {
                Items = items,
                TotalItems = items.Count
            }
        }, ct);
    }
}

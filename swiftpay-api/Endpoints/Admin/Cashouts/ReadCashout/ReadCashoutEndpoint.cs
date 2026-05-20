using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using safefy_api_core.Database;
using safefy_api.EndpointsGroups;
using safefy_api.Mappers;

namespace safefy_api.Endpoints.Admin.Cashouts.ReadCashout;

public sealed class ReadCashoutEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadCashoutRequest, ReadCashoutResponse>
{
    public override void Configure()
    {
        Get("cashouts/{cashoutId:guid}");
        Group<AdminGroup>();
    }

    public override async Task HandleAsync(ReadCashoutRequest req, CancellationToken ct)
    {
        var query = dbContext.Payouts
            .Include(p => p.Merchant)
                .ThenInclude(m => m.User)
            .Include(p => p.PayoutAccount)
            .Include(p => p.MerchantAcquirer)
                .ThenInclude(ma => ma!.Acquirer)
            .Include(p => p.EvaluatedBy)
            .AsQueryable();

        var payout = await query.OrderBy(p => p.Id).FirstOrDefaultAsync(p => p.Id == req.CashoutId, ct);

        if (payout == null)
        {
            await Send.ResponseAsync(new ReadCashoutResponse
            {
                Error = new("Saque não encontrado.")
            }, 404, ct);
            return;
        }

        await Send.OkAsync(new ReadCashoutResponse
        {
            Data = CashoutMapper.ToDetailsData(payout)
        }, ct);
    }
}

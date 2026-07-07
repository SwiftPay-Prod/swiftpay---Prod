using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api.EndpointsGroups;
using swiftpay_api_core.Utils;
using swiftpay_api.Mappers;
using swiftpay_api_core.Models.Enum;

namespace swiftpay_api.Endpoints.Merchants.Cashouts.ReadCashout;

public sealed class ReadCashoutEndpoint(
    PrimaryDbContext dbContext
) : Endpoint<ReadCashoutRequest, ReadCashoutResponse>
{
    public override void Configure()
    {
        Get("{merchantId:guid}/cashouts/{cashoutId:guid}");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadCashoutRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadCashoutResponse
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
            await Send.ResponseAsync(new ReadCashoutResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var payout = await dbContext.Payouts
            .AsNoTracking()
            .Include(p => p.PayoutAccount)
            .OrderBy(p => p.Id)
            .FirstOrDefaultAsync(p => 
                p.Id == req.CashoutId && 
                p.MerchantId == req.MerchantId, ct);

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
            Data = CashoutMapper.ToDetailData(payout)
        }, ct);
    }
}

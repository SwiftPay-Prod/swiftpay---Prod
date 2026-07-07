using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using swiftpay_api_core.Database;
using swiftpay_api_core.Interfaces;
using swiftpay_api_core.Models.Enum;
using swiftpay_api_core.Utils;
using swiftpay_api.EndpointsGroups;
using swiftpay_api.Mappers;

namespace swiftpay_api.Endpoints.Merchants.Balance;

public sealed class ReadBalanceEndpoint(
    PrimaryDbContext dbContext,
    ILedgerService ledgerService
) : Endpoint<ReadBalanceRequest, ReadBalanceResponse>
{
    public override void Configure()
    {
        Get("/{merchantId:guid}/balance");
        Group<MerchantGroup>();
    }

    public override async Task HandleAsync(ReadBalanceRequest req, CancellationToken ct)
    {
        var userId = EndpointUtils.GetUserId(User);
        if (userId == null)
        {
            await Send.ResponseAsync(new ReadBalanceResponse
            {
                Error = new("Token inválido.")
            }, 401, ct);
            return;
        }

        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .OrderBy(m => m.Id)
            .FirstOrDefaultAsync(m => m.Id == req.MerchantId && m.UserId == userId.Value, ct);

        if (merchant == null)
        {
            await Send.ResponseAsync(new ReadBalanceResponse
            {
                Error = new("Organização não encontrada.")
            }, 404, ct);
            return;
        }

        var balanceInfo = await ledgerService.GetMerchantBalanceInfoAsync(req.MerchantId);

        await Send.OkAsync(new ReadBalanceResponse
        {
            Data = BalanceMapper.ToData(balanceInfo)
        }, ct);
    }
}
